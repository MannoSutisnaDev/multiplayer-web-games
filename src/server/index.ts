import next, { NextApiHandler } from "next";

import { app, io, server } from "@/server/init";
import { updateUserData } from "@/server/lobby/utility";
import { SocketServerSide } from "@/server/types";

const port: number = parseInt(process.env.PORT || "3000", 10);
const dev: boolean = process.env.NODE_ENV !== "production";
const nextApp = next({ dev });
const nextHandler: NextApiHandler = nextApp.getRequestHandler();

nextApp.prepare().then(async () => {
  io.on("connection", (socket: SocketServerSide) => {
    socket.data.sessionId = socket.handshake.auth?.sessionId;
    updateUserData(socket);
  });

  app.all("*", (req: any, res: any) => nextHandler(req, res));

  server.listen(port, () => {
    console.log(`> Ready on http://localhost:${port}`);
  });
});
