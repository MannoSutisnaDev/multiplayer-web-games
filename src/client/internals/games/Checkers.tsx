import { useContext, useEffect, useRef, useState } from "react";

import GameToBeDeletedModal from "@/client/internals/modal/implementation/GameToBeDeletedModal";
import { socket } from "@/client/internals/socket/socket";
import { ToastMessageContextWrapper } from "@/client/internals/toast-messages/ToastMessageContext";
import { GameToBeDeleted } from "@/server/games/base/BaseGameModel";
import { GameData } from "@/shared/types/socket-communication/games/checkers";

export default function Checkers() {
  const { addErrorMessage } = useContext(ToastMessageContextWrapper);
  const [gameData, setGameData] = useState<GameData | null>(null);
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

  return (
    <>
      <GameToBeDeletedModal
        show={!!gameToBeDeleted}
        title={gameToBeDeleted?.title ?? ""}
        message={gameToBeDeleted?.message ?? ""}
      />
      <div>
        <h1>Checkers</h1>
        <div>{gameData !== null ? "Done loading" : "Loading..."}</div>
        <div>
          <button
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
        </div>
      </div>
    </>
  );
}
