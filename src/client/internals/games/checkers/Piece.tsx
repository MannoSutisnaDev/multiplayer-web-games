import { MouseEvent, TouchEvent, useContext, useRef } from "react";

import { ChessBoardContext } from "@/client/internals/games/shared/chess-board/ChessBoardWrapper";
import { TwoPlayerTurnBasedContext } from "@/client/internals/games/shared/two-player-turn-based/TwoPlayerTurnBasedWrapper";
import { convertToGamePositionKey } from "@/client/utils";
import {
  BaseCell,
  CheckersPiece,
  MoveMode,
} from "@/shared/types/socket-communication/games/game-types";

export default function Piece({
  row,
  column,
  playerIndex,
  moveMode,
}: Partial<CheckersPiece> & BaseCell) {
  const { isDragging, selectedPieceRef, selectedPiece, setSelectedPiece } =
    useContext(ChessBoardContext);
  const pieceRef = useRef<HTMLDivElement>(null);

  const { currentPlayerIndex, selfPlayerIndex } = useContext(
    TwoPlayerTurnBasedContext
  );

  let piece: null | JSX.Element = null;
  const notAllowed =
    currentPlayerIndex !== selfPlayerIndex ||
    playerIndex !== currentPlayerIndex;

  if (typeof playerIndex === "number") {
    const pieceColor = playerIndex === 0 ? "red" : "white";
    const typeClass = moveMode === MoveMode.KING ? "king" : "regular";
    let iconClass = "";
    if (notAllowed) {
      iconClass = "blocked";
    } else {
      iconClass = !isDragging ? "draggable" : "dragging";
    }
    let selectedClass = "";
    if (selectedPiece) {
      selectedClass =
        convertToGamePositionKey({ row, column }) ===
        convertToGamePositionKey({
          row: selectedPiece.selectedPiece.row,
          column: selectedPiece.selectedPiece.column,
        })
          ? "selected"
          : "";
    }
    const mouseDown = (e: MouseEvent | TouchEvent) => {
      e.preventDefault();
      if (
        isDragging ||
        !selectedPieceRef ||
        !pieceRef.current ||
        selectedPieceRef.current?.dropped
      ) {
        return;
      }
      setSelectedPiece(
        {
          selectedPiece: { row, column, playerIndex },
          dropped: false,
          element: pieceRef.current,
        },
        false
      );
    };
    piece = (
      <div
        className={`piece ${pieceColor} ${typeClass} ${iconClass} ${selectedClass}`}
        ref={pieceRef}
        onMouseDown={mouseDown}
        onTouchStart={mouseDown}
      >
        {typeClass === "king" ? "K" : ""}
      </div>
    );
  }
  return piece;
}
