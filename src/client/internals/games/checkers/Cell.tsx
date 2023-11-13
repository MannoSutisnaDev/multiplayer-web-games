"use client";

import { useContext, useEffect, useRef } from "react";

import { CheckersContextWrapper } from "@/client/internals/games/checkers/Checkers";
import { convertToGamePositionKey } from "@/client/utils";
import { MoveMode } from "@/shared/types/socket-communication/games/game-types";

interface CellProps {
  index: number;
  row: number;
  column: number;
  playerIndex?: number;
  moveMode: MoveMode | null;
}

export default function Cell({
  index,
  row,
  column,
  playerIndex,
  moveMode,
}: CellProps) {
  const {
    isDragging,
    selectedPieceRef,
    selectedPiece,
    setSelectedPiece,
    gamePositionsRef,
    calculateAreasData,
    gameData,
    timestamp,
  } = useContext(CheckersContextWrapper);
  const cellRef = useRef<HTMLDivElement>(null);
  const pieceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!cellRef.current || !gamePositionsRef?.current) {
      return;
    }
    gamePositionsRef.current.set(
      convertToGamePositionKey({
        column,
        row,
      }),
      cellRef.current
    );
    calculateAreasData();
  }, [column, row, gamePositionsRef, calculateAreasData]);

  let color = "";
  if (row % 2 === 0) {
    color = index % 2 === 0 ? "white" : "black";
  } else {
    color = index % 2 == 0 ? "black" : "white";
  }
  let piece: null | JSX.Element = null;
  const notAllowed =
    !gameData ||
    gameData.currentPlayerIndex !== gameData.selfPlayerIndex ||
    playerIndex !== gameData.currentPlayerIndex;

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
    piece = (
      <div
        key={`piece-${timestamp}`}
        className={`piece ${pieceColor} ${typeClass} ${iconClass} ${selectedClass}`}
        ref={pieceRef}
        onMouseDown={(e) => {
          e.preventDefault();
          if (
            isDragging ||
            !selectedPieceRef ||
            !pieceRef.current ||
            notAllowed ||
            selectedPieceRef.current?.dropped
          ) {
            return;
          }
          setSelectedPiece({
            selectedPiece: { row, column, playerIndex },
            dropped: false,
            element: pieceRef.current,
          });
        }}
      >
        {typeClass === "king" ? "K" : ""}
      </div>
    );
  }

  return (
    <div key={`cell-${timestamp}`} className={`cell ${color}`} ref={cellRef}>
      {piece}
    </div>
  );
}
