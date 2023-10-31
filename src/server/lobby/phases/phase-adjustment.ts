import { Phase, SocketServerSide } from "@/server/types";

export function setPhase(socket: SocketServerSide, phase: Phase) {
  removeCurrentPhase(socket);
  for (const [name, func] of Object.entries(phase.functions)) {
    socket.addListener(name, data => func(socket, data))
  }
}

export function removeCurrentPhase(socket: SocketServerSide) {
  if (!socket.data.phase) {
    return;
  }
  const names = Object.keys(socket.data.phase.functions);
  for (const name of names) {
    socket.removeAllListeners(name);
  }
}