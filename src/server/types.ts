import { type Socket } from "socket.io"

import { ClientToServerEvents,ServerToClientEvents } from "@/types/socket-communication/types"

export interface Phase {
  id: string,
  functions: Record<string, ((...args: any[]) => void)>,
}

export interface SocketServerSide extends Socket<ClientToServerEvents, ServerToClientEvents> {
  data: {
    sessionID?: string
    phase?: Phase
  }
}