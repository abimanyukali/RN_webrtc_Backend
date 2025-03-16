const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });
let users = [];

io.on('connection', (socket) => {
  console.log(' user connected', socket.id);
  socket.emit('yourId', socket.id);

  users.push(socket.id);
  io.sockets.emit('users', users);
  console.log('user', users);

  socket.on('disconnect', () => {
    console.log('A user disconnected :', socket.id);
    users = users.filter((user) => user !== socket.id);
    io.sockets.emit('users', users);
  });
  socket.on('offer', (data) => {
    console.log('data is', data);
    io.to(data.id).emit('offer', { data: data.offer, id: socket.id });
  });
  socket.on('answer', (data) => {
    console.log('answer is', data);
    io.to(data.id).emit('answer', { data: data.answer });
  });
  socket.on('ice-candidate', (data) => {
    console.log('ICS is :', data);
    io.to(data.id).emit('ice-candidate', { event: data.event });
  });
});
const PORT = 8000;
server.listen(PORT, () => {
  console.log(`server is running on port ${PORT}`);
});
