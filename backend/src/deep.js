const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
  },
});

let waitingUser = [];
let arr = [];
let b = null;
let c = null;
const onlieUsers = () => {
  const waitingUser_count = waitingUser.length;
  const arr_count = arr.length;
  const total = arr_count * 2 + waitingUser_count + 1;
  return total;
};
io.on('connection', (socket) => {
  console.log(' user connected', socket.id);
  socket.emit('yourId', socket.id);

  socket.emit('total', onlieUsers());
  if (waitingUser.length > 0 && waitingUser[-1] !== socket.id) {
    const partnerId = waitingUser.pop();

    arr.push({
      waitingUserId: partnerId,
      socketId: socket.id,
    });
    console.log('arr', arr);

    socket.to(partnerId).emit('partner-found', socket.id);
  } else {
    if (!waitingUser.includes(socket.id)) {
      waitingUser.push(socket.id);
      console.log('waiting Users:', waitingUser);
    }
  }
  socket.on('disconnect', () => {
    waitingUser = waitingUser.filter((user) => user !== socket.id);
    const z = arr.find(
      (obj) => obj.socketId == socket.id || obj.waitingUserId == socket.id
    );
    if (z) {
      b = [z];
    }
    console.log(' b is ', b);
    if (b) {
      let d = b.find((obj) => obj.socketId == socket.id);
      let e = b.find((obj) => obj.waitingUserId == socket.id);
      c = d ? d.waitingUserId : null;
      if (!c && e) {
        c = e ? e.socketId : null;
      }
    }
    if (c) {
      io.to(c).emit('partner-disconnected');
      io.to(c).emit('call-end');
      if (waitingUser.length > 0 && waitingUser[-1] !== c) {
        let partnerId = waitingUser.pop();
        arr.push({
          waitingUserId: partnerId,
          socketId: c,
        });
        io.to(partnerId).emit('partner-found', c);
      } else {
        if (!waitingUser.includes(c)) {
          waitingUser.unshift(c);
        }
      }
      console.log('after waiting user', waitingUser);
      arr = arr.filter(
        (obj) => obj.socketId !== socket.id && obj.waitingUserId !== socket.id
      );
      console.log('after arr', arr);
    }
    waitingUser = waitingUser.filter((user) => user !== socket.id);
  });

  socket.on('offer', (data) => {
    console.log('offer is', data);
    io.to(data.id).emit('offer', { data: data.offer, id: socket.id });
  });
  socket.on('ice-candidate', (data) => {
    console.log('ICS is :', data);
    io.to(data.id).emit('ice-candidate', { event: data.event });
  });

  socket.on('answer', (data) => {
    console.log('answer is', data);
    io.to(data.id).emit('answer', { data: data.answer });
  });
});
setInterval(() => {
  io.fetchSockets().then((sockets) => {
    const connectionSockets = sockets.map((s) => s.id);
    waitingUser = waitingUser.filter((id) => connectionSockets.includes(id));
  });
}, 2000);
const PORT = 5000;
server.listen(PORT, () => {
  console.log(` Deep Server is running on port ${PORT}`);
});
