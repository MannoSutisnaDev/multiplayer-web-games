"use client";

import { ReactNode, useContext } from "react";

import LobbyComponent from "@/app/lobbies/[id]/LobbyComponent";
import Checkers from "@/client/internals/games/checkers/Checkers";
import { SocketContextWrapper } from "@/client/internals/socket/SocketContext";
import { GameTypes } from "@/shared/types/socket-communication/general";

export default function Lobby() {
  const { playingGame } = useContext(SocketContextWrapper);
  let content: ReactNode;
  switch (playingGame) {
    case GameTypes.Checkers:
      content = <Checkers />;
      break;
    default:
      content = <LobbyComponent />;
      break;
  }
  return content;
}
