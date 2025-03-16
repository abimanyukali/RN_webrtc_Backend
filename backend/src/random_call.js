const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

let waitingQueue = [];

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  socket.emit('yourId', socket.id);

  // Matchmaking logic
  if (waitingQueue.length > 0) {
    const partner = waitingQueue.pop();
    socket.to(partner).emit('partner-found', socket.id);
    socket.emit('partner-found', partner);
  } else {
    waitingQueue.push(socket.id);
  }

  // Cleanup on disconnect
  socket.on('disconnect', () => {
    waitingQueue = waitingQueue.filter((id) => id !== socket.id);
    console.log('User disconnected:', socket.id);
  });

  // Signaling handlers
  socket.on('offer', ({ offer, id }) => {
    console.log('offer', offer);
    console.log('id is ', id);
    socket.to(id).emit('offer', { offer, id: socket.id });
  });

  socket.on('answer', ({ answer, id }) => {
    console.log('answer is created', answer);
    console.log('answer id is ', id);
    socket.to(id).emit('answer', answer);
  });

  socket.on('ice-candidate', ({ event: candidate, id }) => {
    socket.to(id).emit('ice-candidate', { event: candidate });
  });
});

server.listen(5000, () => console.log('Server running on port 5000'));
