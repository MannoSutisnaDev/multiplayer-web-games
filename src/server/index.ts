import next, { NextApiHandler } from "next";

import { app, io, server } from "@/server/init";
import {
  cleanUp,
  handleConnect,
  handleDisconnect,
  setAllUsersToDisconnected,
} from "@/server/lobby/utility";
import { SocketServerSide } from "@/server/types";
import { Disconnect } from "@/shared/types/socket-communication/lobby/general";

const port = parseInt(process.env.PORT || "3000", 10);
const dev: boolean = process.env.MODE !== "production";
const nextApp = next({ dev, hostname: "localhost", port });
const nextHandler: NextApiHandler = nextApp.getRequestHandler();

import { rebuildGames as rebuildCheckerGames } from "@/server/games/checkers/CheckersRepository";

nextApp.prepare().then(async () => {
  await setAllUsersToDisconnected();
  await cleanUp();
  setInterval(cleanUp, 1000 * 600);
  await rebuildCheckerGames();
  io.on("connection", (socket: SocketServerSide) => {
    socket.on(Disconnect, () => {
      handleDisconnect(socket);
    });
    handleConnect(socket);
  });

  app.all("*", (req: any, res: any) => nextHandler(req, res));

  server.listen(port, () => {
    console.log(`> Ready on http://localhost:${port}`);
  });
});
