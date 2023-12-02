"use client";

import { useRouter } from "next/navigation";
import {
  createContext,
  Dispatch,
  PropsWithChildren,
  SetStateAction,
  useEffect,
  useState,
} from "react";

import {
  establishSocketConnection,
  socket,
} from "@/client/internals/socket/socket";
import { tokenStorage } from "@/client/utils";
import { GameTypes } from "@/shared/types/socket-communication/general";

interface SocketContextWrapperInterface {
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
          setUsername(username ?? "");
          setSessionId(sessionId ?? "");
          setLobbyId(lobbyId ?? "");
          setPlayingGame(gameType);
        };
        asyncExecution();
      }
    );
    socket.on("DeleteSessionId", () => {
      tokenStorage().removeToken();
      setUsername("");
      setSessionId("");
      setLobbyId("");
      setPlayingGame(null);
    });
    return () => {
      socket.removeAllListeners("UpdateUserData");
    };
  }, [router]);
  return (
    <SocketContextWrapper.Provider
      value={{
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
