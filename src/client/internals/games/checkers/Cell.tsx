"use client";

import { useContext, useEffect, useRef, useState } from "react";

import { GlobalContextWrapper } from "@/client/internals/global/GlobalContext";
import { socket } from "@/client/internals/socket/socket";
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
    setIsDragging,
    gamePositionsRef,
    calculateAreasData,
    selectedPieceRef,
  } = useContext(GlobalContextWrapper);
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
  if (typeof playerIndex === "number") {
    const pieceColor = playerIndex === 0 ? "red" : "white";
    const typeClass = moveMode === MoveMode.KING ? "king" : "regular";
    piece = (
      <div
        className={`piece ${pieceColor} ${typeClass} ${
          !isDragging ? "draggable" : "dragging"
        }`}
        ref={pieceRef}
        onMouseDown={(e) => {
          e.preventDefault();
          if (isDragging || !selectedPieceRef || !pieceRef.current) {
            return false;
          }
          setIsDragging(true);
          selectedPieceRef.current = {
            selectedPiece: { row, column, playerIndex },
            element: pieceRef.current,
          };
        }}
      >
        {typeClass === "king" ? "K" : ""}
      </div>
    );
  }

  return (
    <div
      className={`cell ${color}`}
      ref={cellRef}
      // onDragOver={(e) => {
      //   e.preventDefault();
      // }}
      // onDrop={(e) => {
      //   if (!selectedPiece) {
      //     return;
      //   }
      //   socket.emit("MovePiece", {
      //     origin: {
      //       row: selectedPiece.row,
      //       column: selectedPiece.column,
      //     },
      //     target: {
      //       row,
      //       column,
      //     },
      //   });
      //   setSelectedPiece(null);
      // }}
    >
      {piece}
    </div>
  );
}
