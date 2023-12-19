"use client";

import { useContext, useEffect, useRef } from "react";

import Piece from "@/client/internals/games/checkers/Piece";
import ChessBoardWrapper, {
  ChessBoardContext,
} from "@/client/internals/games/shared/chess-board/ChessBoardWrapper";
import { BoardProps } from "@/client/internals/games/shared/chess-board/types";
import TwoPlayerTurnBasedWrapper, {
  TwoPlayerTurnBasedContext,
} from "@/client/internals/games/shared/two-player-turn-based/TwoPlayerTurnBasedWrapper";
import { socket } from "@/client/internals/socket/socket";
import { ToastMessageContextWrapper } from "@/client/internals/toast-messages/ToastMessageContext";
import {
  Cell,
  CheckersPiece,
  OriginTargetPayload,
} from "@/shared/types/socket-communication/games/game-types";

function PreCheckers(props: BoardProps<CheckersPiece>) {
  const { addErrorMessage } = useContext(ToastMessageContextWrapper);
  const {
    setIsLoaded,
    setPlayers,
    setCurrentPlayerIndex,
    setSelfPlayerIndex,
    setInterruptingMessage,
  } = useContext(TwoPlayerTurnBasedContext);
  const { setGameCells, setSelectedPiece } = useContext(ChessBoardContext);

  const signaledReady = useRef<boolean>(false);

  useEffect(() => {
    socket.on("GenericResponseError", ({ error }: { error: string }) => {
      setSelectedPiece(null, false);
      addErrorMessage?.(error);
    });
    socket.on("CheckersGameStateUpdateResponse", ({ gameData }) => {
      setPlayers(gameData.players);
      setCurrentPlayerIndex(gameData.currentPlayerIndex);
      setSelfPlayerIndex(gameData.selfPlayerIndex);
      setInterruptingMessage(gameData.interruptingMessage);
      setIsLoaded(true);
      setSelectedPiece(null, false);
      setGameCells(gameData.cells);
    });

    if (!signaledReady.current) {
      signaledReady.current = true;
      socket.emit("ReadyToPlay");
      socket.emit("RequestGameStateUpdate");
    }

    return () => {
      socket.removeAllListeners("GenericResponseError");
      socket.removeAllListeners("CheckersGameStateUpdateResponse");
    };
  }, [
    addErrorMessage,
    setCurrentPlayerIndex,
    setGameCells,
    setInterruptingMessage,
    setIsLoaded,
    setPlayers,
    setSelectedPiece,
    setSelfPlayerIndex,
  ]);

  return props.board;
}

const CheckersWrapped = ChessBoardWrapper(PreCheckers);

const FinalCheckers = TwoPlayerTurnBasedWrapper(CheckersWrapped);

export default function Checkers() {
  return (
    <FinalCheckers
      renderPiece={(cell: Cell<CheckersPiece> | null) => {
        if (cell === null) {
          return;
        }
        const data = {
          index: cell.index,
          row: cell.row,
          column: cell.column,
          playerIndex: cell.playerPiece?.playerIndex,
          moveMode: cell.playerPiece?.moveMode,
        };
        return <Piece {...data} />;
      }}
      leaveFunction={() => {
        if (
          !confirm(
            "Are you sure want to leave this game? The game will be deleted."
          )
        ) {
          return;
        }
        socket.emit("LeaveGame");
      }}
      movePiece={(payload: OriginTargetPayload) => {
        socket.emit("MovePiece", payload);
      }}
    />
  );
}
