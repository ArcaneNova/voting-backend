const express = require('express');
const cors = require('cors');
const { Server } = require('socket.io');
const http = require('http');
const path = require('path');
require('dotenv').config();

const userRoutes = require('./routes/users');
const pollRoutes = require('./routes/polls');
const voteRoutes = require('./routes/votes');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

app.use(cors());
app.use(express.json());

app.use('/api/users', userRoutes);
app.use('/api/polls', pollRoutes);
app.use('/api/votes', voteRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Real-Time Polling API is running!' });
});

app.get('/demo', async (req, res) => {
  try {
    const prisma = require('./db/prisma');
    const polls = await prisma.poll.findMany({
      where: { isPublished: true },
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
            name: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    res.render('demo', { polls });
  } catch (error) {
    console.error('Error fetching polls for demo:', error);
    res.render('demo', { polls: [] });
  }
});

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join-poll', (pollId) => {
    socket.join(`poll-${pollId}`);
    console.log(`User ${socket.id} joined poll ${pollId}`);
  });

  socket.on('leave-poll', (pollId) => {
    socket.leave(`poll-${pollId}`);
    console.log(`User ${socket.id} left poll ${pollId}`);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

app.set('io', io);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});