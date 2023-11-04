import { handleDisconnect } from "@/server/lobby/utility";
import { SocketServerSide } from "@/server/types";
import { Disconnect } from "@/shared/types/socket-communication/lobby/general";

export const GeneralClientToServer = {
  [Disconnect]: (socket: SocketServerSide) => {
    handleDisconnect(socket);
    console.log(`Disconected: ${socket.data?.sessionId}`);
  },
};
