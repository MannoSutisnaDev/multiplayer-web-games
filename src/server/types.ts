import { type Socket } from "socket.io";

import { Phase } from "@/shared/types/socket-communication/types";
import {
  ClientToServerEvents,
  ServerToClientEvents,
} from "@/shared/types/socket-communication/types";

export interface SocketServerSide
  extends Socket<ClientToServerEvents, ServerToClientEvents> {
  data: {
    sessionId?: string;
    phase?: Phase;
  };
}
