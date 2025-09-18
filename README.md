# Real-Time Polling Application API

A backend service for a real-time polling application built with Node.js, Express, PostgreSQL, Prisma, and WebSocket support.

## Features

- RESTful API for managing users, polls, and votes
- Real-time poll results using WebSocket
- Interactive web demo with Express templates (EJS)
- PostgreSQL database with Prisma ORM
- Proper database relationships (One-to-Many and Many-to-Many)
- Password hashing with bcrypt
- CORS support for cross-origin requests

## Technologies Used

- **Backend Framework**: Node.js with Express.js
- **Template Engine**: EJS
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Real-time Communication**: Socket.IO
- **Password Hashing**: bcrypt
- **Environment Variables**: dotenv
- **Frontend**: Bootstrap 5, Vanilla JavaScript

## Database Schema

The application uses the following models with proper relationships:

- **User**: id, name, email, passwordHash
- **Poll**: id, question, isPublished, createdAt, updatedAt
- **PollOption**: id, text
- **Vote**: id (with many-to-many relationship between User and PollOption)

## Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- PostgreSQL database
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd voting
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
Create a `.env` file in the root directory and add:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/voting_app?schema=public"
PORT=3000
```

4. Set up the database:
```bash
npm run prisma:generate
npm run prisma:migrate
```

5. Start the development server:
```bash
npm run dev
```

The server will start on `http://localhost:3000`

## Demo Page

Visit `http://localhost:3000/demo` to access the interactive real-time polling demo. The demo page features:

- **Live Poll Selection**: Choose from published polls
- **Real-time Results**: Watch vote counts update instantly as votes are cast
- **WebSocket Status**: Monitor connection status
- **Quick Vote Testing**: Submit test votes directly from the interface
- **Bootstrap UI**: Clean, responsive interface

The demo page automatically connects to the WebSocket server and displays real-time updates when votes are submitted through the API.

## API Endpoints

### Users

- `POST /api/users` - Create a new user
  ```json
  {
    "name": "Johny lever",
    "email": "johny@example.com",
    "password": "securepassword"
  }
  ```

- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID

### Polls

- `POST /api/polls` - Create a new poll
  ```json
  {
    "question": "What's your favorite programming language?",
    "options": ["JavaScript", "Python", "Java", "Go"],
    "creatorId": "user-id",
    "isPublished": true
  }
  ```

- `GET /api/polls` - Get all polls (optional query: `?published=true`)
- `GET /api/polls/:id` - Get poll by ID
- `PUT /api/polls/:id` - Update poll (publish/unpublish)

### Votes

- `POST /api/votes` - Submit a vote
  ```json
  {
    "userId": "user-id",
    "pollOptionId": "option-id"
  }
  ```

- `GET /api/votes/poll/:pollId` - Get poll results
- `GET /api/votes/user/:userId` - Get user's voting history

## WebSocket Events

### Client to Server

- `join-poll` - Join a specific poll room for real-time updates
- `leave-poll` - Leave a poll room

### Server to Client

- `vote-update` - Broadcast updated vote counts when a new vote is cast
  ```json
  {
    "pollId": "poll-id",
    "results": [
      {
        "id": "option-id",
        "text": "Option text",
        "voteCount": 5
      }
    ]
  }
  ```

## Scripts

- `npm start` - Start the production server
- `npm run dev` - Start the development server with nodemon
- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:studio` - Open Prisma Studio

## Testing the Application

1. **Start the server**: `npm run dev`
2. **Access the demo**: Visit `http://localhost:3000/demo`
3. **API Testing**: Use the test-endpoints.http file or Postman
4. **WebSocket Testing**: Use the interactive demo page to see real-time updates

## Project Structure

```
voting/
├── db/
│   └── prisma.js          # Prisma client configuration
├── prisma/
│   └── schema.prisma      # Database schema
├── routes/
│   ├── users.js           # User API routes
│   ├── polls.js           # Poll API routes
│   └── votes.js           # Vote API routes
├── views/
│   └── demo.ejs           # EJS template for demo page
├── public/
│   ├── css/
│   │   └── demo.css       # Styles for demo page
│   └── js/
│       └── demo.js        # JavaScript for real-time functionality
├── .env                   # Environment variables
├── server.js              # Main server file with Express & Socket.IO
├── package.json           # Project dependencies and scripts
├── test-endpoints.http    # API testing file
└── README.md             # This file
```

## Database Relationships

- **One-to-Many**: User → Polls (A user can create many polls)
- **One-to-Many**: Poll → PollOptions (A poll can have many options)
- **Many-to-Many**: User ↔ PollOptions (Users can vote on multiple options, options can be voted by multiple users)

The many-to-many relationship is implemented using the Vote model as a join table with additional metadata.