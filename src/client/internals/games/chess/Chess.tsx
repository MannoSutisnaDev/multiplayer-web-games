"use client";

import { useContext, useEffect, useRef } from "react";

import Piece from "@/client/internals/games/chess/Piece";
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
  ChessPiece,
  OriginTargetPayload,
} from "@/shared/types/socket-communication/games/game-types";

function PreChess(props: BoardProps<ChessPiece>) {
  const { addErrorMessage } = useContext(ToastMessageContextWrapper);
  const {
    setIsLoaded,
    setPlayers,
    setCurrentPlayerIndex,
    setSelfPlayerIndex,
    setInterruptingMessage,
  } = useContext(TwoPlayerTurnBasedContext);
  const { setGameCells, setSelectedPiece, setTimestamp } =
    useContext(ChessBoardContext);

  const signaledReady = useRef<boolean>(false);

  useEffect(() => {
    socket.on("GenericResponseError", ({ error }: { error: string }) => {
      setSelectedPiece(null, false);
      setTimestamp(new Date().getTime());
      addErrorMessage?.(error);
    });
    socket.on("ChessGameStateUpdateResponse", ({ gameData }) => {
      setPlayers(gameData.players);
      setCurrentPlayerIndex(gameData.currentPlayerIndex);
      setSelfPlayerIndex(gameData.selfPlayerIndex);
      setInterruptingMessage(gameData.interruptingMessage);
      setIsLoaded(true);
      setSelectedPiece(null, false);
      setGameCells(gameData.cells);
      setTimestamp(new Date().getTime());
    });

    if (!signaledReady.current) {
      signaledReady.current = true;
      socket.emit("ReadyToPlay");
      socket.emit("RequestGameStateUpdate");
    }

    return () => {
      socket.removeAllListeners("GenericResponseError");
      socket.removeAllListeners("ChessGameStateUpdateResponse");
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
    setTimestamp,
  ]);

  return props.board;
}

const ChessWrapped = ChessBoardWrapper(PreChess);

const FinalChess = TwoPlayerTurnBasedWrapper(ChessWrapped);

export default function Chess() {
  return (
    <FinalChess
      renderPiece={(cell: Cell<ChessPiece> | null) => {
        if (cell === null) {
          return;
        }
        const data = {
          index: cell.index,
          row: cell.row,
          column: cell.column,
          playerIndex: cell.playerPiece?.playerIndex,
          type: cell.playerPiece?.type,
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
      boardClass="chess"
    />
  );
}
