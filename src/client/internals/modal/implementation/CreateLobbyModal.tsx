"use client";

import { useRouter } from "next/navigation";
import { useContext, useState } from "react";
import { useEffect } from "react";

import ModalWrapper from "@/client/internals/modal/ModalWrapper";
import { socket } from "@/client/internals/socket/socket";
import { SocketContextWrapper } from "@/client/internals/socket/SocketContext";
import { ToastMessageContextWrapper } from "@/client/internals/toast-messages/ToastMessageContext";
import { BaseModalProps } from "@/client/types";
import { GameTypesData } from "@/shared/types/socket-communication/general";
import { GameTypes } from "@/shared/types/socket-communication/general";
import { entries } from "@/shared/utility";

function CreateLobbyModalPre({ close }: BaseModalProps) {
  const { addErrorMessage } = useContext(ToastMessageContextWrapper);
  const { setLobbyId } = useContext(SocketContextWrapper);
  const router = useRouter();

  const [lobbyName, setLobbyName] = useState("");
  const [gameType, setGameType] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    socket.on("CreateLobbyResponseSuccess", ({ lobbyId }) => {
      setIsSubmitting(false);
      if (!lobbyId) {
        return;
      }
      setLobbyId(lobbyId);
    });
    socket.on("CreateLobbyResponseError", ({ error }) => {
      setIsSubmitting(false);
      addErrorMessage?.(error);
    });
    return () => {
      socket.removeAllListeners("CreateLobbyResponseSuccess");
      socket.removeAllListeners("CreateLobbyResponseError");
    };
  }, [addErrorMessage, router, setLobbyId]);

  return (
    <div className="create-edit-lobby-modal">
      <h1>Create lobby</h1>
      <span
        className="close"
        onClick={(e) => {
          e.stopPropagation();
          close();
        }}
      >
        &times;
      </span>
      <div className="form-row">
        <div className="form-row-label">Lobby name</div>
        <div className="form-row-input">
          <input
            type="text"
            id="lobby-name"
            className="username-input"
            placeholder="lobby-name"
            value={lobbyName}
            autoComplete="off"
            onChange={(e) => setLobbyName(e.target.value)}
            disabled={isSubmitting}
          />
        </div>
      </div>
      <div className="form-row">
        <div className="form-row-label">Game</div>
        <div className="form-row-input">
          <select
            id="game-to-play"
            value={gameType}
            onChange={(e) => setGameType(e.target.value)}
            disabled={isSubmitting}
          >
            <option disabled value="">
              Select a game
            </option>
            {entries(GameTypesData).map((entry, index) => {
              const [key, gameData] = entry;
              return (
                <option key={`game-type-${index}`} value={key}>
                  {gameData.name}
                </option>
              );
            })}
          </select>
        </div>
      </div>
      <button
        className="submit"
        onClick={(e) => {
          e.preventDefault();
          if (!lobbyName) {
            addErrorMessage?.("Lobby name can't be empty.");
            return;
          }
          if (!gameType) {
            addErrorMessage?.("Game type can't be empty.");
            return;
          }
          setIsSubmitting(true);
          socket.emit("CreateLobby", {
            lobbyName,
            gameType: gameType as GameTypes,
          });
        }}
        disabled={isSubmitting}
      >
        Submit
      </button>
    </div>
  );
}

const CreateLobbyModalWrapped = ModalWrapper(CreateLobbyModalPre);

export default function CreateLobbyModal(props: BaseModalProps) {
  return <CreateLobbyModalWrapped {...props} />;
}
