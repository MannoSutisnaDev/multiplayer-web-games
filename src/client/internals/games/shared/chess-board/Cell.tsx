"use client";

import { useContext, useEffect, useRef } from "react";

import { ChessBoardContext } from "@/client/internals/games/shared/chess-board/ChessBoardWrapper";
import { convertToGamePositionKey } from "@/client/utils";
import {
  Cell as CellType,
  Piece,
} from "@/shared/types/socket-communication/games/game-types";

interface CellProps<T extends Piece> {
  index: number;
  row: number;
  column: number;
  renderPiece: (cell: CellType<T> | null) => React.ReactNode;
  playerPiece: T | null;
}

export default function Cell<T extends Piece>({
  index,
  row,
  column,
  playerPiece,
  renderPiece,
}: CellProps<T>) {
  const { gamePositionsRef } = useContext(ChessBoardContext);
  const cellRef = useRef<HTMLDivElement>(null);

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
  }, [column, row, gamePositionsRef]);

  let color = "";
  if (row % 2 === 0) {
    color = index % 2 === 0 ? "white" : "black";
  } else {
    color = index % 2 == 0 ? "black" : "white";
  }
  return (
    <div className={`cell ${color}`} ref={cellRef}>
      {renderPiece({
        index,
        row,
        column,
        playerPiece,
      })}
    </div>
  );
}
