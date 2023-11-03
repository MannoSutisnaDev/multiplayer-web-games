"use client";

import { useRouter } from "next/navigation";
import { createContext, Dispatch, SetStateAction } from "react";
import { PropsWithChildren, useEffect, useState } from "react";

import {
  establishSocketConnection,
  socket,
} from "@/app/internals/socket/socket";
import { GameTypes } from "@/shared/types/socket-communication/general";

interface SocketContextWrapperInterface {
  dataLoaded: boolean;
  setDataLoaded: Dispatch<SetStateAction<boolean>>;
  username: string;
  setUsername: Dispatch<SetStateAction<string>>;
  sessionId: string;
  setSessionId: Dispatch<SetStateAction<string>>;
  lobbyId: string;
  setLobbyId: Dispatch<SetStateAction<string>>;
  playingGame: GameTypes | null;
  setPlayingGame: Dispatch<SetStateAction<GameTypes | null>>;
}

export const SocketContextWrapper =
  createContext<SocketContextWrapperInterface>({
    dataLoaded: false,
    setDataLoaded: () => {},
    username: "",
    setUsername: () => {},
    sessionId: "",
    setSessionId: () => {},
    lobbyId: "",
    setLobbyId: () => {},
    playingGame: null,
    setPlayingGame: () => {},
  });

export default function SocketContext({ children }: PropsWithChildren) {
  const [dataLoaded, setDataLoaded] = useState(false);
  const [username, setUsername] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [lobbyId, setLobbyId] = useState("");
  const [playingGame, setPlayingGame] = useState<GameTypes | null>(null);

  const router = useRouter();
  useEffect(() => {
    establishSocketConnection();
    return () => {
      socket.disconnect();
    };
  }, []);
  useEffect(() => {
    socket.on(
      "UpdateUserData",
      ({ username, sessionId, lobbyId, gameType }) => {
        const asyncExecution = async () => {
          setDataLoaded(true);
          setUsername(username ?? "");
          setSessionId(sessionId ?? "");
          setLobbyId(lobbyId ?? "");
          setPlayingGame(gameType);
        };
        asyncExecution();
      }
    );
    return () => {
      socket.removeAllListeners("UpdateUserData");
    };
  }, [router]);
  return (
    <SocketContextWrapper.Provider
      value={{
        dataLoaded,
        setDataLoaded,
        username,
        setUsername,
        sessionId,
        setSessionId,
        lobbyId,
        setLobbyId,
        playingGame,
        setPlayingGame,
      }}
    >
      {children}
    </SocketContextWrapper.Provider>
  );
}
