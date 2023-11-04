import prisma from "@/server/db";
import { GeneralClientToServer } from "@/server/lobby/phases/general";
import { updateUserData } from "@/server/lobby/utility";
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
      socket.emit("GenericResponseError", {
        error: "Username already exists.",
      });
      return;
    }

    user = await prisma.user.create({
      data: {
        username,
        connected: true,
      },
    });
    socket.data.sessionId = user.id;
    socket.emit("EnterUsernameResponseSuccess", {
      sessionId: user.id,
      username,
    });
    updateUserData(socket);
  };
  asyncExecution();
};

export const PhaseEnterUsername: Phase = {
  id: PhaseIdEnterUsername,
  functions: {
    [EnterUsername]: enterUsername,
    ...GeneralClientToServer,
  },
};
