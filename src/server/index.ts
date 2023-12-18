import { Request, Response } from "express";
import next, { NextApiHandler, NextApiRequest, NextApiResponse } from "next";

import { app, io, server } from "@/server/init";
import {
  cleanUp,
  handleConnect,
  handleDisconnect,
  setAllUsersToDisconnected,
} from "@/server/lobby/utility";
import { SocketServerSide } from "@/server/types";
import { routeGuard } from "@/server/utils";
import { Disconnect } from "@/shared/types/socket-communication/lobby/general";

const port = parseInt(process.env.PORT || "3001", 10);
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

  app.all("*", async (req: Request, res: Response) => {
    // await routeGuard(req);
    return nextHandler(
      req as unknown as NextApiRequest,
      res as unknown as NextApiResponse
    );
  });

  server.listen(port, () => {
    console.log(`> Ready on http://localhost:${port}`);
  });
});
