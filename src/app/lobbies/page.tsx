"use client";

import { useRouter } from "next/navigation";
import { useContext, useEffect, useState } from "react";

import ResponsiveTable from "@/client/components/ResponsiveTable";
import CreateLobbyModal from "@/client/internals/modal/implementation/CreateLobbyModal";
import { socket } from "@/client/internals/socket/socket";
import { SocketContextWrapper } from "@/client/internals/socket/SocketContext";
import { ToastMessageContextWrapper } from "@/client/internals/toast-messages/ToastMessageContext";
import { LobbyWithGameTypeAndUsers } from "@/shared/types/socket-communication/types";

type LobbyData = {
  lobby: string;
  game: string;
  players: string;
  spectators: string;
  join: React.ReactElement;
  spectate: React.ReactElement;
};

export default function Lobbies() {
  const { addErrorMessage } = useContext(ToastMessageContextWrapper);
  const { username, setLobbyId } = useContext(SocketContextWrapper);
  const router = useRouter();

  const [lobbies, setLobbies] = useState<LobbyWithGameTypeAndUsers[]>([]);
  const [timestamp, setTimestamp] = useState(new Date().getTime());
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showModal, setShowModal] = useState<boolean>(false);

  useEffect(() => {
    socket.on("GenericResponseError", ({ error }: { error: string }) => {
      setIsSubmitting(false);
      addErrorMessage?.(error);
    });
    socket.on(
      "JoinLobbyResponseSuccess",
      ({ lobbyId }: { lobbyId: string }) => {
        setIsSubmitting(false);
        if (!lobbyId) {
          return;
        }
        setLobbyId(lobbyId);
      }
    );
    socket.on("CreateLobbyResponseSuccess", ({ lobbyId }) => {
      setIsSubmitting(false);
      if (!lobbyId) {
        return;
      }
      setLobbyId(lobbyId);
    });
    socket.on("UpdateLobbiesResponse", ({ lobbies }) => {
      setLobbies(lobbies);
      setTimestamp(new Date().getTime());
    });
    socket.emit("RequestUpdateLobbies");

    return () => {
      socket.removeAllListeners("GenericResponseError");
      socket.removeAllListeners("JoinLobbyResponseSuccess");
    };
  }, [addErrorMessage, router, setLobbyId]);

  const joinLobby = (lobbyId: string) => {
    if (isSubmitting) {
      return;
    }
    setIsSubmitting(true);
    socket.emit("JoinLobby", { lobbyId });
  };

  const lobbiesData: LobbyData[] = [];
  for (const lobby of lobbies) {
    const { name, GameType, Users } = lobby;
    const lobbyData: LobbyData = {
      lobby: name,
      game: GameType.name,
      players: `${Users.length ?? 0} / ${GameType.maxPlayers}`,
      spectators: "0 / 0",
      join: (
        <button
          className="btn"
          disabled={
            lobby.gameStarted ||
            lobby.Users.length === lobby.GameType.maxPlayers
          }
          onClick={() => joinLobby(lobby.id)}
        >
          Join
        </button>
      ),
      spectate: (
        <button className="btn" disabled={true} onClick={() => {}}>
          Spectate
        </button>
      ),
    };
    lobbiesData.push(lobbyData);
  }

  const columns = {
    "lobby-name": "Lobby",
    "game-name": "Game",
    "player-info": "Players",
    spectators: "Spectators",
    join: "",
    spectate: "",
  };

  return (
    <>
      <CreateLobbyModal show={showModal} close={() => setShowModal(false)} />
      <ResponsiveTable<LobbyData>
        key={timestamp}
        caption={<h1>Lobbies</h1>}
        data={lobbiesData}
        columns={columns}
        appendage={
          <div className="button-section">
            <button
              className="create-lobby-button"
              disabled={isSubmitting}
              onClick={(e: React.MouseEvent<HTMLElement>) => {
                e.stopPropagation();
                setShowModal(true);
              }}
            >
              Create lobby
            </button>
          </div>
        }
        tableClass="lobbies-overview"
      />
      {/* <div className="waiting-room-body lobbies-body">
        <div className="waiting-room-container lobbies-container">
          <div className="waiting-room-info">
            <h1 className="waiting-room-title">
              Lobbies{username ? `: (${username})` : ""}
            </h1>
          </div>
          <div className="waiting-room-columns">
            <div className="waiting-room-row lobby-row">
              <h2 className="lobby-name">Lobby</h2>
              <h2 className="game-name">Game</h2>
              <h2 className="player-info">Players</h2>
              <h2 className="spectators">Spectators</h2>
              <h2 className="join" />
            </div>
          </div>
          <div className="waiting-room-rows">
            {lobbies.map((lobby, index) => {
              const { name, GameType, Users } = lobby;
              return (
                <div
                  key={`lobby-${index}`}
                  className="waiting-room-row lobby-row"
                >
                  <h2 className="lobby-name">{name}</h2>
                  <div className="game-name">{GameType.name}</div>
                  <div className="player-info">
                    {Users.length ?? 0} / {GameType.maxPlayers}
                  </div>
                  <div className="spectators">0</div>
                  <div className="join">
                    <button
                      className="btn"
                      disabled={
                        lobby.gameStarted ||
                        lobby.Users.length === lobby.GameType.maxPlayers
                      }
                      onClick={() => joinLobby(lobby.id)}
                    >
                      Join
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="button-section">
            <button
              className="create-lobby-button"
              disabled={isSubmitting}
              onClick={(e: React.MouseEvent<HTMLElement>) => {
                e.stopPropagation();
                setShowModal(true);
              }}
            >
              Create lobby
            </button>
          </div>
        </div>
      </div> */}
    </>
  );
}
