"use client";

import { io } from "socket.io-client";

import { SocketClientSide } from "@/app/types";

const socket = io({ autoConnect: false }) as SocketClientSide;

const establishSocketConnection = () => {
  const sessionId = sessionStorage.getItem("sessionId");
  if (!sessionId) {
    socket.connect();
    return;
  }
  socket.auth = { sessionId };
  socket.connect();
};

export { establishSocketConnection, socket };
