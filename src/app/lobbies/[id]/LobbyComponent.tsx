"use client";

import { useContext, useEffect, useState } from "react";

import ThreeDotsMenu from "@/client/components/ThreeDotsMenu";
import EditLobbyModal from "@/client/internals/modal/implementation/EditLobbyModal";
import { socket } from "@/client/internals/socket/socket";
import { SocketContextWrapper } from "@/client/internals/socket/SocketContext";
import { ToastMessageContextWrapper } from "@/client/internals/toast-messages/ToastMessageContext";
import { LobbyWithGameTypeAndUsers } from "@/shared/types/socket-communication/types";

export default function Lobby() {
  const { addErrorMessage } = useContext(ToastMessageContextWrapper);
  const { sessionId, lobbyId } = useContext(SocketContextWrapper);
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

  const playerSelf = lobby?.Users?.find?.((player) => player.id === sessionId);

  const playerIsOwner = playerSelf?.LobbyItOwns?.id === lobbyId;

  const title = lobby
    ? `Lobby "${lobby?.name}" | Game "${lobby.GameType.name}"`
    : "";

  const playerRows = lobby?.Users.map((player, index) => {
    const playerSelfClass = sessionId === player.id ? "player-self" : "";
    const options: {
      label: string;
      function: () => void;
    }[] = [
      {
        label: "Make user owner",
        function: () => socket.emit("SetNewOwner", { userId: player.id }),
      },
      {
        label: "Kick user",
        function: () => socket.emit("KickUser", { userId: player.id }),
      },
    ];
    return (
      <div key={`player-${index}`} className="waiting-room-row player-row">
        <h2 className={`name ${playerSelfClass}`}>{player.username}</h2>
        <div className="status">{player.ready ? "Ready" : "Not ready"}</div>
        <div className="options options-content">
          {playerIsOwner && player.id !== sessionId && (
            <ThreeDotsMenu options={options} />
          )}
        </div>
      </div>
    );
  });

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
  if (playerIsOwner) {
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
              <h2 className="options" />
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
