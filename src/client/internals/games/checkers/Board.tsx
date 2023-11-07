"use client";

import { useState } from "react";

import Cell from "@/client/internals/games/checkers/Cell";
import { SelectedPiece } from "@/client/internals/games/checkers/types";
import { GameDataInterface } from "@/server/games/checkers/CheckersGame";

interface Props {
  gameData: GameDataInterface | null;
}

export default function Board({ gameData }: Props) {
  const [selectedPiece, setSelectedPiece] = useState<SelectedPiece | null>(
    null
  );
  const rowCollection: Array<Array<JSX.Element>> = [];
  for (const cells of gameData?.cells ?? []) {
    const columnCollection: Array<JSX.Element> = [];
    for (const cell of cells) {
      columnCollection.push(
        <Cell
          key={`cell-${cell.index}`}
          index={cell.index}
          row={cell.row}
          column={cell.column}
          playerIndex={cell?.playerPiece?.playerIndex}
          moveMode={cell.playerPiece?.moveMode ?? null}
          selectedPiece={selectedPiece}
          setSelectedPiece={(pieceToSelect: SelectedPiece | null) => {
            setSelectedPiece(pieceToSelect);
          }}
        />
      );
    }
    rowCollection.push(columnCollection);
  }
  return (
    <div className="board">
      {rowCollection.map((columnCollection, rowIndex) => {
        return (
          <div key={`row-${rowIndex}`} className="row">
            {columnCollection.map((column) => {
              return column;
            })}
          </div>
        );
      })}
    </div>
  );
}
