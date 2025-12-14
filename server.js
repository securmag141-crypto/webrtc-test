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

// Корневой маршрут
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Статические файлы
app.use(express.static(__dirname));

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
    console.log(`✅ ${socket.userId} answered ${to}`);
    io.to(`user_${to}`).emit('call:answered', {
      from: socket.userId,
      answer: answer
    });
  });
  
  socket.on('call:ice', (data) => {
    const { to, candidate } = data;
    console.log(`🧊 ICE from ${socket.userId} to ${to}`);
    io.to(`user_${to}`).emit('call:ice', {
      from: socket.userId,
      candidate: candidate
    });
  });
  
  socket.on('call:end', (data) => {
    const { to } = data;
    console.log(`❌ ${socket.userId} ended call with ${to}`);
    if (to) {
      io.to(`user_${to}`).emit('call:ended', { from: socket.userId });
    }
  });
  
  socket.on('disconnect', () => {
    console.log('❌ User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
