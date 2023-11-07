"use client";

import { SelectedPiece } from "@/client/internals/games/checkers/types";
import { socket } from "@/client/internals/socket/socket";
import { MoveMode } from "@/shared/types/socket-communication/games/game-types";

interface CellProps {
  index: number;
  row: number;
  column: number;
  playerIndex?: number;
  setSelectedPiece: (pieceToSelect: SelectedPiece | null) => void;
  moveMode: MoveMode | null;
  selectedPiece: {
    row: number;
    column: number;
    playerIndex: number;
  } | null;
}

export default function Cell({
  index,
  row,
  column,
  playerIndex,
  moveMode,
  setSelectedPiece,
  selectedPiece,
}: CellProps) {
  let color = "";
  if (row % 2 === 0) {
    color = index % 2 === 0 ? "white" : "black";
  } else {
    color = index % 2 == 0 ? "black" : "white";
  }
  let piece: null | JSX.Element = null;
  if (typeof playerIndex === "number") {
    const pieceColor = playerIndex === 0 ? "red" : "white";
    const typeClass = moveMode === MoveMode.KING ? "king" : "regular";
    piece = (
      <div
        className={`piece ${pieceColor} ${typeClass}`}
        onDragStart={() => {
          setSelectedPiece({ row, column, playerIndex });
        }}
        onDragEnd={() => {}}
        draggable
      >
        {typeClass === "king" ? "K" : ""}
      </div>
    );
  }

  return (
    <div
      className={`cell ${color}`}
      onDragOver={(e) => {
        e.preventDefault();
      }}
      onDrop={(e) => {
        if (!selectedPiece) {
          return;
        }
        socket.emit("MovePiece", {
          origin: {
            row: selectedPiece.row,
            column: selectedPiece.column,
          },
          target: {
            row,
            column,
          },
        });
        setSelectedPiece(null);
      }}
    >
      {piece}
    </div>
  );
}
