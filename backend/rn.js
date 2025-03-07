const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*', // Allow all origins (for development)
  },
});

let users = [];

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);
  socket.emit('yourId', socket.id);

  // Add user to the list
  users.push(socket.id);
  io.sockets.emit('users', users);
  console.log('users', users);
  // If there are at least 2 users, pair them
  // if (users.length >= 2) {
  //   const user1 = users.shift();
  //   const user2 = users.shift();

  //   // Notify both users to start a call
  //   io.to(user1).emit('call', user2);
  //   io.to(user2).emit('call', user1);
  // }

  // Handle signaling (WebRTC offer/answer/candidate exchange)


  // offer
  socket.on('offer', (data) => {
    // console.log('data is', data);
    io.to(data.id).emit('offer', { data: data.offer, id: socket.id });
  });

  //answer
  socket.on('answer', (data) => {
    // console.log('answer is', data);
    io.to(data.id).emit('answer', { data: data.answer });
  });

  //ICE
  socket.on('ice-candidate', (data) => {
    console.log('ICS is :', data);
    io.to(data.id).emit('ice-candidate', { event: data.event });
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('A user disconnected:', socket.id);
    users = users.filter((user) => user !== socket.id);
    io.sockets.emit('users', users);
  });
});

setInterval(() => {
  io.fetchSockets().then((sockets) => {
    const connectionSockets = sockets.map((s) => s.id);
    users = users.filter((id) => connectionSockets.includes(id));
    // io.sockets.emit('users', users);
  });
}, 10000);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
