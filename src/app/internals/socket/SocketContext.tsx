"use client";

import { useRouter } from "next/navigation";
import { createContext, Dispatch, SetStateAction } from "react";
import { PropsWithChildren, useEffect, useState } from "react";

import {
  establishSocketConnection,
  socket,
} from "@/app/internals/socket/socket";

interface SocketContextWrapperInterface {
  sessionId: string;
  setSessionId: Dispatch<SetStateAction<string>>;
  lobbyId: string;
  setLobbyId: Dispatch<SetStateAction<string>>;
}

export const SocketContextWrapper =
  createContext<SocketContextWrapperInterface>({
    sessionId: "",
    setSessionId: () => {},
    lobbyId: "",
    setLobbyId: () => {},
  });

export default function SocketContext({ children }: PropsWithChildren) {
  const router = useRouter();
  const [sessionId, setSessionId] = useState<string>("");
  const [lobbyId, setLobbyId] = useState<string>("");
  useEffect(() => {
    establishSocketConnection();
    return () => {
      socket.disconnect();
    };
  }, []);
  useEffect(() => {
    socket.on("UpdateUserData", ({ sessionId, lobbyId }) => {
      if (sessionId && lobbyId) {
        setSessionId(sessionId);
        setLobbyId(lobbyId);
        router.replace(`/lobbies/${lobbyId}`);
      } else if (sessionId) {
        setSessionId(sessionId);
        router.replace("/lobbies");
      }
    });
    return () => {
      socket.removeAllListeners("UpdateUserData");
    };
  }, [router]);
  return (
    <SocketContextWrapper.Provider
      value={{ sessionId, setSessionId, lobbyId, setLobbyId }}
    >
      {children}
    </SocketContextWrapper.Provider>
  );
}
