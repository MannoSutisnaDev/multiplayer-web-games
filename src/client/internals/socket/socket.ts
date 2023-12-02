"use client";

import { io } from "socket.io-client";

import { SocketClientSide } from "@/client/types";
import { tokenStorage } from "@/client/utils";

const socket = io({ autoConnect: false }) as SocketClientSide;

const establishSocketConnection = () => {
  const sessionId = tokenStorage().getToken();
  if (!sessionId) {
    socket.connect();
    return;
  }
  socket.auth = { sessionId };
  socket.connect();
};

export { establishSocketConnection, socket };
