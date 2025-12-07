import dotenv from 'dotenv';
dotenv.config();

import http from 'http';
import createApp from './app.js';
import connectDB from './utils/db.js';
import { setupSocket } from './utils/socket.js';

const PORT = process.env.PORT || 5000;

async function start() {
  try {
    await connectDB(process.env.MONGO_URI);
    const app = createApp();
    const server = http.createServer(app);
    setupSocket(server); // initialize socket.io

    server.listen(PORT, () => {
      console.log(`Backend listening on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();
