const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    // allowedHeaders: ['my-custom-header'],
    credentials: true,
  },
});
app.use(cors());
app.use(express.json());

let waitingUser = [];
let arr = [];
let b = null;
let c = null;
io.on('connection', (socket) => {
  console.log('User Connected', socket.id);
  socket.emit('yourId', socket.id);

  if (waitingUser.length > 0 && waitingUser[-1] !== socket.id) {
    let partnerId = waitingUser.pop();

    console.log('id', socket.id);
    arr.push({
      waitingUserId: partnerId,
      socketId: socket.id,
    });

    console.log('arr', arr);
    io.to(partnerId).emit('partner-found', socket.id);
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
  //user 1 gto 2
  socket.on('signal', ({ to, data }) => {
    if (data.type == 'offer' && to !== socket.id) {
      io.to(to).emit('hey', { signal: data, from: socket.id });
    }
  });
  //user 2 to 1
  socket.on('acceptCall', ({ to, signal }) => {
    if (signal.type == 'answer' && to !== socket.id) {
      io.to(to).emit('callAccepted', signal);
    }
  });

  socket.on('call-end', ({ to }) => {
    console.log('call end', to);
    io.to(to).emit('call-end');
    console.log('arr before value is ', arr);
    arr = arr.filter(
      (obj) => obj.socketId !== socket.id && obj.waitingUserId !== socket.id
    );

    console.log('arr after value is ', arr);
    if (waitingUser.length > 0) {
      let partnerId = waitingUser.pop();
      arr.push({
        waitingUserId: partnerId,
        socketId: to,
      });
      io.to(partnerId).emit('partner-found', to);
      if (waitingUser.length > 0) {
        let partnerId = waitingUser.pop();
        arr.push({
          waitingUser: partnerId,
          socketId: socket.id,
        });
        io.to(partnerId).emit('partner-found', socket.id);
      } else {
        waitingUser.push(socket.id);
      }
    } else {
      waitingUser.push(to, socket.id);
    }
  });

  socket.on('sendMessage', (message) => {
    console.log('message', message);
    io.to(message.to).emit('message', message);
  });
});
setInterval(() => {
  io.fetchSockets().then((sockets) => {
    const connectionSockets = sockets.map((s) => s.id);
    waitingUser = waitingUser.filter((id) => connectionSockets.includes(id));
  });
}, 2000);

const PORT = 5000;
server.listen(PORT, () =>
  console.log(`server running on http://localhost:${PORT}`)
);
