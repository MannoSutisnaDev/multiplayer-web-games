import next, { NextApiHandler } from "next";

import prisma from "@/server/db";
import { app, io, server } from "@/server/init";
import { PhaseEnterUsername } from "@/server/lobby/phases/enter-username-phase";
import { setPhase } from "@/server/lobby/phases/phase-adjustment";
import { SocketServerSide } from "@/server/types";

const port: number = parseInt(process.env.PORT || "3000", 10);
const dev: boolean = process.env.NODE_ENV !== "production";
const nextApp = next({ dev });
const nextHandler: NextApiHandler = nextApp.getRequestHandler();

nextApp.prepare().then(async () => {
  io.on("connection", (socket: SocketServerSide) => {
    const asyncExecution = async () => {
      const sessionID = socket.handshake.auth?.sessionID;
      const user = await prisma.user.findFirst({
        where: {
          id: { equals: sessionID },
        },
      });
      if (!sessionID || !user) {
        setPhase(socket, PhaseEnterUsername);
      }
    };
    asyncExecution();

    socket.on("disconnect", () => {
      console.log(`Disconected: ${socket.data?.sessionID}`);
    });
  });

  app.all("*", (req: any, res: any) => nextHandler(req, res));

  server.listen(port, () => {
    console.log(`> Ready on http://localhost:${port}`);
  });
});
