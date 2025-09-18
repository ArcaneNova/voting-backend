const express = require('express');
const prisma = require('../db/prisma');

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { userId, pollOptionId } = req.body;

    if (!userId || !pollOptionId) {
      return res.status(400).json({ error: 'User ID and poll option ID are required' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const pollOption = await prisma.pollOption.findUnique({
      where: { id: pollOptionId },
      include: { poll: true }
    });

    if (!pollOption) {
      return res.status(404).json({ error: 'Poll option not found' });
    }

    const existingVote = await prisma.vote.findUnique({
      where: {
        userId_pollOptionId: {
          userId,
          pollOptionId
        }
      }
    });

    if (existingVote) {
      return res.status(400).json({ error: 'User has already voted for this option' });
    }

    const vote = await prisma.vote.create({
      data: {
        userId,
        pollOptionId
      },
      include: {
        user: {
          select: {
            id: true,
            name: true
          }
        },
        pollOption: {
          include: {
            poll: true
          }
        }
      }
    });

    const pollWithResults = await prisma.poll.findUnique({
      where: { id: pollOption.pollId },
      include: {
        options: {
          include: {
            _count: {
              select: { votes: true }
            }
          }
        }
      }
    });

    const io = req.app.get('io');
    if (io) {
      io.to(`poll-${pollOption.pollId}`).emit('vote-update', {
        pollId: pollOption.pollId,
        results: pollWithResults.options.map(option => ({
          id: option.id,
          text: option.text,
          voteCount: option._count.votes
        }))
      });
    }

    res.status(201).json({
      vote,
      message: 'Vote cast successfully'
    });
  } catch (error) {
    console.error('Error creating vote:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/poll/:pollId', async (req, res) => {
  try {
    const { pollId } = req.params;

    const poll = await prisma.poll.findUnique({
      where: { id: pollId }
    });

    if (!poll) {
      return res.status(404).json({ error: 'Poll not found' });
    }

    const results = await prisma.pollOption.findMany({
      where: { pollId },
      include: {
        _count: {
          select: { votes: true }
        }
      }
    });

    const formattedResults = results.map(option => ({
      id: option.id,
      text: option.text,
      voteCount: option._count.votes
    }));

    res.json({
      pollId,
      results: formattedResults,
      totalVotes: formattedResults.reduce((sum, option) => sum + option.voteCount, 0)
    });
  } catch (error) {
    console.error('Error fetching vote results:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userVotes = await prisma.vote.findMany({
      where: { userId },
      include: {
        pollOption: {
          include: {
            poll: {
              select: {
                id: true,
                question: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json(userVotes);
  } catch (error) {
    console.error('Error fetching user votes:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;