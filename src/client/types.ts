import { type Socket } from "socket.io-client";

import {
  ClientToServerEvents,
  ServerToClientEvents,
} from "@/shared/types/socket-communication/types";

export interface SocketClientSide
  extends Socket<ServerToClientEvents, ClientToServerEvents> {
  data: {
    sessionId?: string;
    lobbyId?: string;
    gameIsPlaying?: boolean;
  };
}

export interface BaseModalProps {
  show: boolean;
  modalInnerExtraClass?: string;
  close?: () => void;
}
