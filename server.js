const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(express.static(path.join(__dirname, 'public')));

// Сигнальный сервер для звонков
io.on('connection', (socket) => {
  console.log('✅ User connected:', socket.id);
  
  socket.on('register', (userId) => {
    socket.userId = userId;
    socket.join(`user_${userId}`);
    console.log(`📞 User ${userId} registered`);
  });
  
  socket.on('call:offer', (data) => {
    const { to, offer, caller } = data;
    console.log(`📞 ${socket.userId} calling ${to}`);
    io.to(`user_${to}`).emit('call:incoming', {
      from: socket.userId,
      offer: offer,
      caller: caller
    });
  });
  
  socket.on('call:answer', (data) => {
    const { to, answer } = data;
    io.to(`user_${to}`).emit('call:answered', {
      from: socket.userId,
      answer: answer
    });
  });
  
  socket.on('call:end', (data) => {
    const { to } = data;
    if (to) io.to(`user_${to}`).emit('call:ended', { from: socket.userId });
  });
  
  socket.on('call:ice', (data) => {
    const { to, candidate } = data;
    io.to(`user_${to}`).emit('call:ice', {
      from: socket.userId,
      candidate: candidate
    });
  });
  
  socket.on('disconnect', () => {
    console.log('❌ User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});