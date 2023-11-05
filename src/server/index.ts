import next, { NextApiHandler } from "next";

import { app, io, server } from "@/server/init";
import {
  handleConnect,
  handleDisconnect,
  updateUserData,
} from "@/server/lobby/utility";
import { SocketServerSide } from "@/server/types";
import { Disconnect } from "@/shared/types/socket-communication/lobby/general";

const port: number = parseInt(process.env.PORT || "3000", 10);
const dev: boolean = process.env.NODE_ENV !== "production";
const nextApp = next({ dev });
const nextHandler: NextApiHandler = nextApp.getRequestHandler();

import {
  rebuildGames as rebuildCheckerGames,
  repository as checkersRepository,
} from "@/server/games/checkers/CheckersRepository";

nextApp.prepare().then(async () => {
  await rebuildCheckerGames();
  io.on("connection", (socket: SocketServerSide) => {
    socket.data.sessionId = socket.handshake.auth?.sessionId;
    socket.on(Disconnect, () => {
      handleDisconnect(socket);
    });
    const asyncExecution = async () => {
      await updateUserData(socket);
      handleConnect(socket);
    };
    asyncExecution();
  });

  app.all("*", (req: any, res: any) => nextHandler(req, res));

  server.listen(port, () => {
    console.log(`> Ready on http://localhost:${port}`);
  });
});
