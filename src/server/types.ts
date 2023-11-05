import { type Socket } from "socket.io";

import {   ClientToServerEvents,
Phase ,
  ServerToClientEvents,
} from "@/shared/types/socket-communication/types";


export interface SocketServerSide
  extends Socket<ClientToServerEvents, ServerToClientEvents> {
  data: {
    sessionId?: string;
    phase?: Phase;
  };
}
