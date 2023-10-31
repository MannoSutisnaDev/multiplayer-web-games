import prisma from "@/server/db";
import { Phase, SocketServerSide } from "@/server/types";
import { ENTER_USERNAME } from "@/types/socket-communication/lobby/enter-username";

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
      socket.emit("EnterSessionResponseError", {
        error: "Username already exists.",
      });
      return;
    }

    user = await prisma.user.create({
      data: {
        username,
      },
    });

    socket.emit("EnterSessionResponseSuccess", { sessionId: user.id });
  };
  asyncExecution();
};

export const PhaseEnterUsername: Phase = {
  id: "enter-username",
  functions: {
    [ENTER_USERNAME]: enterUsername,
  },
};
