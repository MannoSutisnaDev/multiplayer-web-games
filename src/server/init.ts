import express, { Express } from 'express';
import { createServer, Server as HTTPServer } from 'http';
import { Server } from 'socket.io';

const app: Express = express();
const server: HTTPServer = createServer(app);
const io: Server = new Server();
io.attach(server);

export {
  app,
  io,
  server
}
