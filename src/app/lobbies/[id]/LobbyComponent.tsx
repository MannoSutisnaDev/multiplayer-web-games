"use client";

import { useContext, useEffect, useState } from "react";

import ResponsiveTable from "@/client/components/ResponsiveTable";
import ThreeDotsMenu from "@/client/components/ThreeDotsMenu";
import EditLobbyModal from "@/client/internals/modal/implementation/EditLobbyModal";
import { socket } from "@/client/internals/socket/socket";
import { SocketContextWrapper } from "@/client/internals/socket/SocketContext";
import { ToastMessageContextWrapper } from "@/client/internals/toast-messages/ToastMessageContext";
import { LobbyWithGameTypeAndUsers } from "@/shared/types/socket-communication/types";

type PlayerData = {
  name: string;
  status: string;
  options: React.ReactElement;
};

export default function Lobby() {
  const { addErrorMessage } = useContext(ToastMessageContextWrapper);
  const { sessionId, lobbyId } = useContext(SocketContextWrapper);
  const [lobby, setLobby] = useState<LobbyWithGameTypeAndUsers | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [timestamp, setTimestamp] = useState(new Date().getTime());

  useEffect(() => {
    socket.on("GenericResponseError", ({ error }: { error: string }) => {
      setIsSubmitting(false);
      addErrorMessage?.(error);
    });
    socket.on("UpdateLobbyResponse", ({ lobby }) => {
      setLobby(lobby);
      setTimestamp(new Date().getTime());
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

  const playerSelf = lobby?.Players?.find?.(
    (player) => player.userId === sessionId
  );

  const playerIsOwner = playerSelf?.User?.LobbyItOwns?.id === lobbyId;

  const playerIsSpectator = playerSelf?.spectator;

  const title = lobby
    ? `Lobby "${lobby?.name}" | Game "${lobby.GameType.name}"`
    : "";

  const columns = {
    name: "Player name",
    status: "Status",
    options: "",
  };

  let extraClasses = [];
  const players = lobby?.Players ?? [];
  for (let i = 0; i < players.length; i++) {
    const player = players[i];
    extraClasses.push([
      sessionId === player.userId ? "player-self" : null,
      null,
      null,
    ]);
  }

  const playerRows: PlayerData[] = players.map((player, index) => {
    const options: {
      label: string;
      function: () => void;
    }[] = [
      {
        label: "Make user owner",
        function: () => socket.emit("SetNewOwner", { userId: player.userId }),
      },
      {
        label: "Kick user",
        function: () => socket.emit("KickUser", { userId: player.userId }),
      },
    ];

    let status = player.spectator ? "Spectator" : "";
    if (!player.spectator) {
      status = player.ready ? "Ready" : "Not ready";
    }
    return {
      name: player.User.username,
      status,
      options: (
        <div className="options options-content">
          {playerIsOwner && player.userId !== sessionId && (
            <ThreeDotsMenu options={options} />
          )}
        </div>
      ),
    };
  });

  let readyButton = null;
  if (!playerIsSpectator) {
    readyButton = (
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
  }
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
      <ResponsiveTable<PlayerData>
        key={timestamp}
        caption={<h1>{title}</h1>}
        data={playerRows}
        columns={columns}
        appendage={
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
        }
        tableClass="lobby-overview"
        extraColumnClasses={extraClasses}
      />
    </>
  );
}
