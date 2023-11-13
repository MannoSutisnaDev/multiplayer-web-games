"use client";

import Cell from "@/client/internals/games/checkers/Cell";
import { CheckersGameDataInterface } from "@/server/games/types";

interface Props {
  gameData: CheckersGameDataInterface | null;
}

export default function Board({ gameData }: Props) {
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
