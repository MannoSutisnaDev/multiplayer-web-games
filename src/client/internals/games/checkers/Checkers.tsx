"use client";

import { useContext, useEffect, useRef, useState } from "react";

import Board from "@/client/internals/games/checkers/Board";
import InterruptingMessageModal from "@/client/internals/modal/implementation/InterruptingMessageModal";
import { socket } from "@/client/internals/socket/socket";
import { ToastMessageContextWrapper } from "@/client/internals/toast-messages/ToastMessageContext";
import { GameToBeDeleted } from "@/server/games/base/BaseGameModel";
import { GameDataInterface } from "@/server/games/checkers/CheckersGame";

export default function Checkers() {
  const { addErrorMessage } = useContext(ToastMessageContextWrapper);
  const [gameData, setGameData] = useState<GameDataInterface | null>(null);
  const [gameToBeDeleted, setGameToBeDeleted] =
    useState<GameToBeDeleted | null>(null);
  const signaledReady = useRef<boolean>(false);

  useEffect(() => {
    socket.on("GenericResponseError", ({ error }: { error: string }) => {
      addErrorMessage?.(error);
    });
    socket.on(
      "CheckersGameStateUpdateResponse",
      ({ gameData, gameToBeDeleted }) => {
        setGameData(gameData);
        setGameToBeDeleted(gameToBeDeleted);
      }
    );

    if (!signaledReady.current) {
      signaledReady.current = true;
      socket.emit("ReadyToPlay");
      socket.emit("RequestGameStateUpdate");
    }

    return () => {
      socket.removeAllListeners("GenericResponseError");
    };
  }, [addErrorMessage]);

  let topPlayerClass: string = "";
  let topPlayerName: string = "";
  let bottomPlayerClass: string = "";
  let bottomPlayerName: string = "";
  if (gameData?.selfPlayerIndex === 0) {
    topPlayerClass = `player-label ${
      gameData.currentPlayerIndex === 1 ? "selected" : ""
    }`;
    topPlayerName = gameData.players[1].name;
    bottomPlayerClass = `player-label ${
      gameData.currentPlayerIndex === 0 ? "selected" : ""
    }`;
    bottomPlayerName = gameData.players[0].name;
  } else if (gameData?.selfPlayerIndex === 1) {
    topPlayerClass = `player-label ${
      gameData.currentPlayerIndex === 0 ? "selected" : ""
    }`;
    topPlayerName = gameData.players[0].name;
    bottomPlayerClass = `player-label ${
      gameData.currentPlayerIndex === 1 ? "selected" : ""
    }`;
    bottomPlayerName = gameData.players[1].name;
  }

  return (
    <>
      <InterruptingMessageModal
        show={!gameToBeDeleted && !!gameData?.gameOverMessage}
        title={"Game over"}
        message={gameData?.gameOverMessage ?? ""}
      />
      <InterruptingMessageModal
        show={!!gameToBeDeleted}
        title={gameToBeDeleted?.title ?? ""}
        message={gameToBeDeleted?.message ?? ""}
      />
      <div className="main-wrapper">
        <button
          className="leave-button"
          onClick={() => {
            if (
              !confirm(
                "Are you sure want to leave this game? The game will be deleted."
              )
            ) {
              return;
            }
            socket.emit("LeaveGame");
          }}
        >
          Leave game
        </button>
        {gameData === null ? (
          <div className="main">Loading...</div>
        ) : (
          <div className="main">
            <div className="game-container">
              <div className="player-label-container">
                <div className={topPlayerClass}>{topPlayerName}</div>
              </div>
              <Board gameData={gameData} />
              <div className="player-label-container">
                <div className={bottomPlayerClass}>{bottomPlayerName}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
