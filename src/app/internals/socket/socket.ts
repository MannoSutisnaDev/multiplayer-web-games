'use client';

import { CREATE_SESSION_RESPONSE } from "@/types/socket-communication";

import { io } from "socket.io-client";

const socket = io({ autoConnect: false });

socket.on(CREATE_SESSION_RESPONSE, ({sessionID}: { sessionID?: string}) => {
  if (!sessionID) {
    return;
  }
  socket.auth = { sessionID };
  sessionStorage.setItem('sessionID', sessionID);
})

const establishSocketConnection = () => {
  const sessionID = sessionStorage.getItem('sessionID');
  if (!sessionID) {
    socket.connect();
    return;
  }
  socket.auth = { sessionID };
  socket.connect();
}

export {
  socket,
  establishSocketConnection
}