import prisma from "@/server/db";
import { setPhase } from "@/server/lobby/phases/adjust-phase";
import { PhaseLobbies } from "@/server/lobby/phases/lobbies";
import { SocketServerSide } from "@/server/types";
import {
  EnterUsername,
  PhaseIdEnterUsername,
} from "@/shared/types/socket-communication/lobby/enter-username";
import { Phase } from "@/shared/types/socket-communication/types";

const enterUsername = (
  socket: SocketServerSide,
  { username }: { username: string }
) => {
  const asyncExecution = async () => {
    let user = await prisma.user.findFirst({
      where: {
        username: { equals: username },
      },
    });

    if (user) {
      socket.emit("EnterUsernameResponseError", {
        error: "Username already exists.",
      });
      return;
    }

    user = await prisma.user.create({
      data: {
        username,
      },
    });
    socket.data.sessionId = user.id;
    setPhase(socket, PhaseLobbies);
    socket.emit("EnterUsernameResponseSuccess", { sessionId: user.id });
  };
  asyncExecution();
};

export const PhaseEnterUsername: Phase = {
  id: PhaseIdEnterUsername,
  functions: {
    [EnterUsername]: enterUsername,
  },
};
