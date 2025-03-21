const express = require('express');
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { Server } = require('socket.io');
const cors = require('cors');
const app = express();
const server = http.createServer(
  {
    key: fs.readFileSync(path.join(__dirname, 'cert', 'key.pem')),
    cert: fs.readFileSync(path.join(__dirname, 'cert', 'cert.pem')),
  },
  app
);
var corsOptions = {
  origin: '*',
  optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204
};
app.use(cors(corsOptions));

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    // allowedHeaders: ['my-custom-header'],
    credentials: true,
  },
  transports: ['websocket'], // Force WebSocket transport only
  secure: true, // Enable secure connection
  allowEIO3: true,
});
app.get('/', (req, res) => {
  console.log('some one connected');
  res.send('hello world');
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
  if (waitingUser.length > 0 && waitingUser.at(-1) !== socket.id) {
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
    waitingUser = waitingUser?.filter((user) => user !== socket.id);
    const z = arr?.find(
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
      io.to(c).emit('disconnect2');
      io.to(c).emit('call-end');
      if (waitingUser.length > 0 && waitingUser.at(-1) !== c) {
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
      arr = arr?.filter(
        (obj) => obj.socketId !== socket.id && obj.waitingUserId !== socket.id
      );
      console.log('after arr', arr);
    }
    waitingUser = waitingUser?.filter((user) => user !== socket.id);
  });

  socket.on('offer', (data) => {
    // console.log('offer is', data);
    io.to(data.id).emit('offer', { data: data.offer, id: socket.id });
  });
  socket.on('ice-candidate', (data) => {
    // console.log('ICS is :', data);
    io.to(data.id).emit('ice-candidate', { event: data.event });
  });

  socket.on('answer', (data) => {
    // console.log('answer is', data);
    io.to(data.id).emit('answer', { data: data.answer });
  });

  socket.on('next', ({ partnerId }) => {
    // io.to(data.partnerId).emit('disconnect2');
    console.log('socket.id', socket.id);
    console.log('partnerId is', partnerId);
    socket.emit('disconnect2');
    io.to(partnerId, 'disconnect2');
    arr = arr?.filter(
      (obj) => obj.socketId !== socket.id && obj.waitingUserId !== socket.id
    );
    if (
      waitingUser.length > 0 &&
      waitingUser.at(-1) !== partnerId &&
      partnerId
    ) {
      let partnerId2 = waitingUser.pop();
      arr.push({
        waitingUserId: partnerId2,
        socketId: partnerId,
      });
      io.to(partnerId2).emit('partner-found', partnerId);
    } else {
      if (!waitingUser.includes(partnerId)) {
        waitingUser.unshift(partnerId);
      }
    }
    if (waitingUser.length > 0 && waitingUser.at(-1) !== socket.id) {
      let partnerId2 = waitingUser.pop();
      arr.push({
        waitingUserId: partnerId2,
        socketId: socket.id,
      });
      io.to(partnerId2).emit('partner-found', socket.id);
    } else {
      if (!waitingUser.includes(socket.id)) {
        waitingUser.unshift(socket.id);
      }
    }

    console.log('after arr', arr);
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
