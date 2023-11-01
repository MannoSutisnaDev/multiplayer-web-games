import { SocketServerSide } from "@/server/types";
import { Phase } from "@/shared/types/socket-communication/types";

export function setPhase(socket: SocketServerSide, phase: Phase) {
  removeCurrentPhase(socket);
  for (const [name, func] of Object.entries(phase.functions)) {
    // @ts-ignore
    socket.on(name, (data) => func(socket, data));
  }
  socket.data.phase = phase;
}

export function removeCurrentPhase(socket: SocketServerSide) {
  if (!socket.data.phase) {
    return;
  }
  const names = Object.keys(socket.data.phase.functions);
  for (const name of names) {
    // @ts-ignore
    socket.removeAllListeners(name);
  }
}
