import http from 'http';
import { Server } from 'socket.io';
import express from 'express';
import path from "path";
import data from './data.js';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import seedRouter from './routes/seedRoutes.js';
import productRouter from './routes/productRoutes.js';
import userRouter from './routes/userRoutes.js';
import orderRouter from './routes/orderRoutes.js';
import uploadRouter from './routes/uploadRoutes.js';

dotenv.config();

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connected to Database');
  })
  .catch((err) => {
    console.log(err.message);
  });

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/api/keys/paypal', (req, res) => {
  res.send(process.env.PAYPAL_CLIENT_ID || 'sb');
});

app.use('/api/upload', uploadRouter);
app.use('/api/seed', seedRouter);
app.use('/api/products', productRouter);
app.use('/api/users', userRouter);
app.use('/api/orders', orderRouter);

app.use((err, req, res, next) => {
  res.status(500).send({ message: err.message });
});


const httpServer = http.Server(app);

const io = new Server(httpServer, { cors: { origin: "*" } });
const users = [];

io.on("connection", (socket) => {
  socket.on("onLogin", (user) => {
    const updatedUser = {
      ...user,
      online: true,
      socketId: socket.id,
      messages: [],
    };

    const existUser = users.find((x) => x.name === updatedUser.name);
    if (existUser) {
      existUser.socketId = socket.id;
      existUser.online = true;
    } else {
      users.push(updatedUser);
    }
    const admin = users.find((x) => x.name === "Admin" && x.online);
    if (admin) {
      io.to(admin.socketId).emit("updateUser", updatedUser);
    }
    if (updatedUser.name === "Admin") {
      io.to(updatedUser.socketId).emit("listUsers", users);
    }
  });

  socket.on("disconnect", () => {
    const user = users.find((x) => x.socketId === socket.id);
    if (user) {
      user.online = false;
      const admin = users.find((x) => x.name === "Admin" && x.online);
      if (admin) {
        io.to(admin.socketId).emit("updateUser", user);
      }
    }
  });
  socket.on("onUserSelected", (user) => {
    const admin = users.find((x) => x.name === "Admin" && x.online);
    if (admin) {
      const existUser = users.find((x) => x.name === user.name);
      io.to(admin.socketId).emit("selectUser", existUser);
    }
  });
  socket.on("onMessage", (message) => {
    if (message.from === "Admin") {
      const user = users.find((x) => x.name === message.to && x.online);
      if (user) {
        io.to(user.socketId).emit("message", message);
        user.messages.push(message);
      } else {
        io.to(socket.id).emit("message", {
          from: "System",
          to: "Admin",
          body: "User Is Not Online",
        });
      }
    } else {
      const admin = users.find((x) => x.name === "Admin" && x.online);
      if (admin) {
        io.to(admin.socketId).emit("message", message);
        const user = users.find((x) => x.name === message.from && x.online);
        if (user) {
          user.messages.push(message);
        }
      } else {
        io.to(socket.id).emit("message", {
          from: "System",
          to: message.from,
          body: "Sorry. Admin is not online right now",
        });
      }
    }
  });
});

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`Server started at http://localhost:${PORT}`);
});