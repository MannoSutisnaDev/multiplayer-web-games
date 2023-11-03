"use client";

import { useContext, useEffect, useState } from "react";

import EditLobbyModal from "@/app/internals/modal/implementation/EditLobbyModal";
import { socket } from "@/app/internals/socket/socket";
import { SocketContextWrapper } from "@/app/internals/socket/SocketContext";
import { ToastMessageContextWrapper } from "@/app/internals/toast-messages/ToastMessageContext";
import { LobbyWithGameTypeAndUsers } from "@/shared/types/socket-communication/types";

export default function Lobby() {
  const { addErrorMessage } = useContext(ToastMessageContextWrapper);
  const { sessionId } = useContext(SocketContextWrapper);
  const [lobby, setLobby] = useState<LobbyWithGameTypeAndUsers | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showModal, setShowModal] = useState<boolean>(false);

  useEffect(() => {
    socket.on("GenericResponseError", ({ error }: { error: string }) => {
      setIsSubmitting(false);
      addErrorMessage?.(error);
    });
    socket.on("UpdateLobbyResponse", ({ lobby }) => {
      setLobby(lobby);
    });
    socket.on("SetReadyResponseSuccess", () => {
      setIsSubmitting(false);
    });
    socket.emit("RequestUpdateLobby");

    return () => {
      socket.removeAllListeners("GenericResponseError");
      socket.removeAllListeners("UpdateLobbyResponse");
      socket.removeAllListeners("SetReadyResponseSuccess");
    };
  }, [addErrorMessage]);

  const title = lobby
    ? `Lobby "${lobby?.name}" | Game "${lobby.GameType.name}"`
    : "";

  const playerRows = lobby?.Users.map((player, index) => {
    if (!player.connected) {
      return null;
    }
    const playerSelfClass = sessionId === player.id ? "player-self" : "";
    return (
      <div key={`player-${index}`} className="waiting-room-row player-row">
        <h2 className={`name ${playerSelfClass}`}>{player.username}</h2>
        <div className="status">{player.ready ? "Ready" : "Not ready"}</div>
      </div>
    );
  });

  const playerSelf = lobby?.Users?.find?.((player) => player.id === sessionId);

  const readyButton = (
    <button
      id="ready"
      className="ready-button"
      disabled={isSubmitting}
      onClick={() => {
        setIsSubmitting(true);
        socket.emit("SetReady", { ready: !playerSelf?.ready });
      }}
    >
      {!playerSelf?.ready ? "Ready" : "Not ready"}
    </button>
  );
  const leaveButton = (
    <button
      id="leave"
      className="leave-button"
      disabled={isSubmitting}
      onClick={() => {
        setIsSubmitting(true);
        socket.emit("LeaveLobby");
      }}
    >
      Leave
    </button>
  );

  let startButton: React.ReactElement | null = null;
  let editLobbyButton: React.ReactElement | null = null;
  if (playerSelf?.lobbyOwner) {
    startButton = (
      <button
        id="start"
        className="start-button"
        disabled={isSubmitting}
        onClick={() => {
          setIsSubmitting(true);
          socket.emit("StartGame");
        }}
      >
        Start
      </button>
    );
    editLobbyButton = (
      <button
        id="edit-lobby"
        className="edit-lobby-button"
        disabled={isSubmitting || !lobby}
        onClick={() => {
          setShowModal(true);
        }}
      >
        Edit lobby
      </button>
    );
  }

  return (
    <>
      <EditLobbyModal
        show={showModal}
        close={() => setShowModal(false)}
        lobby={lobby}
      />
      <div className="waiting-room-body lobby-body">
        <div className="waiting-room-container lobby-container">
          <div className="waiting-room-info">
            <h1 className="waiting-room-title">{title}</h1>
          </div>
          <div className="waiting-room-columns">
            <div className="waiting-room-row player-row">
              <h2 className="name">Player name</h2>
              <h2 className="status">Status</h2>
            </div>
          </div>
          <div className="waiting-room-rows">{playerRows}</div>
          <div className="button-section left-right">
            <div className="left-section">
              {startButton}
              {readyButton}
            </div>
            <div className="right-section">
              {leaveButton}
              {editLobbyButton}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
