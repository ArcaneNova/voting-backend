const express = require('express');
const prisma = require('../db/prisma');

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { question, options, creatorId, isPublished = false } = req.body;

    if (!question || !options || !Array.isArray(options) || options.length < 2) {
      return res.status(400).json({ error: 'Question and at least 2 options are required' });
    }

    if (!creatorId) {
      return res.status(400).json({ error: 'Creator ID is required' });
    }

    const creator = await prisma.user.findUnique({
      where: { id: creatorId }
    });

    if (!creator) {
      return res.status(404).json({ error: 'Creator not found' });
    }

    const poll = await prisma.poll.create({
      data: {
        question,
        isPublished,
        creatorId,
        options: {
          create: options.map(option => ({
            text: option
          }))
        }
      },
      include: {
        options: {
          include: {
            _count: {
              select: { votes: true }
            }
          }
        },
        creator: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    res.status(201).json(poll);
  } catch (error) {
    console.error('Error creating poll:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/', async (req, res) => {
  try {
    const { published } = req.query;

    const whereClause = published !== undefined ? { isPublished: published === 'true' } : {};

    const polls = await prisma.poll.findMany({
      where: whereClause,
      include: {
        options: {
          include: {
            _count: {
              select: { votes: true }
            }
          }
        },
        creator: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json(polls);
  } catch (error) {
    console.error('Error fetching polls:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const poll = await prisma.poll.findUnique({
      where: { id },
      include: {
        options: {
          include: {
            _count: {
              select: { votes: true }
            }
          }
        },
        creator: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (!poll) {
      return res.status(404).json({ error: 'Poll not found' });
    }

    res.json(poll);
  } catch (error) {
    console.error('Error fetching poll:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { isPublished } = req.body;

    const poll = await prisma.poll.findUnique({
      where: { id }
    });

    if (!poll) {
      return res.status(404).json({ error: 'Poll not found' });
    }

    const updatedPoll = await prisma.poll.update({
      where: { id },
      data: { isPublished },
      include: {
        options: {
          include: {
            _count: {
              select: { votes: true }
            }
          }
        },
        creator: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    res.json(updatedPoll);
  } catch (error) {
    console.error('Error updating poll:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;