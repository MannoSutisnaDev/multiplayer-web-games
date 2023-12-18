import Image from "next/image";
import { useCallback, useContext, useRef } from "react";

import bishopBlack from "@/client/internals/games/chess/assets/bishop-black.svg";
import bishopWhite from "@/client/internals/games/chess/assets/bishop-white.svg";
import kingBlack from "@/client/internals/games/chess/assets/king-black.svg";
import kingWhite from "@/client/internals/games/chess/assets/king-white.svg";
import knightBlack from "@/client/internals/games/chess/assets/knight-black.svg";
import knightWhite from "@/client/internals/games/chess/assets/knight-white.svg";
import pawnBlack from "@/client/internals/games/chess/assets/pawn-black.svg";
import pawnWhite from "@/client/internals/games/chess/assets/pawn-white.svg";
import queenBlack from "@/client/internals/games/chess/assets/queen-black.svg";
import queenWhite from "@/client/internals/games/chess/assets/queen-white.svg";
import rookBlack from "@/client/internals/games/chess/assets/rook-black.svg";
import rookWhite from "@/client/internals/games/chess/assets/rook-white.svg";
import { ChessBoardContext } from "@/client/internals/games/shared/chess-board/ChessBoardWrapper";
import { TwoPlayerTurnBasedContext } from "@/client/internals/games/shared/two-player-turn-based/TwoPlayerTurnBasedWrapper";
import { convertToGamePositionKey } from "@/client/utils";
import { PIECE_TYPES } from "@/shared/types/socket-communication/games/chess";
import {
  BaseCell,
  ChessPiece,
} from "@/shared/types/socket-communication/games/game-types";

export default function Piece({
  row,
  column,
  playerIndex,
  type,
}: Partial<ChessPiece> & BaseCell) {
  const {
    isDragging,
    selectedPieceRef,
    selectedPiece,
    setSelectedPiece,
    timestamp,
  } = useContext(ChessBoardContext);
  const pieceRef = useRef<HTMLDivElement>(null);

  const { currentPlayerIndex, selfPlayerIndex } = useContext(
    TwoPlayerTurnBasedContext
  );

  const determineImage = useCallback(
    (pieceType: PIECE_TYPES, playerIndex: number): string | null => {
      let image: string | null = null;
      if (playerIndex === 1) {
        switch (pieceType) {
          case PIECE_TYPES.KING:
            image = kingBlack;
            break;
          case PIECE_TYPES.QUEEN:
            image = queenBlack;
            break;
          case PIECE_TYPES.ROOK:
            image = rookBlack;
            break;
          case PIECE_TYPES.BISHOP:
            image = bishopBlack;
            break;
          case PIECE_TYPES.KNIGHT:
            image = knightBlack;
            break;
          case PIECE_TYPES.PAWN:
            image = pawnBlack;
            break;
        }
      } else {
        switch (pieceType) {
          case PIECE_TYPES.KING:
            image = kingWhite;
            break;
          case PIECE_TYPES.QUEEN:
            image = queenWhite;
            break;
          case PIECE_TYPES.ROOK:
            image = rookWhite;
            break;
          case PIECE_TYPES.BISHOP:
            image = bishopWhite;
            break;
          case PIECE_TYPES.KNIGHT:
            image = knightWhite;
            break;
          case PIECE_TYPES.PAWN:
            image = pawnWhite;
            break;
        }
      }
      if (!image) {
        return null;
      }
      return image;
    },
    []
  );

  let piece: null | JSX.Element = null;
  const notAllowed =
    currentPlayerIndex !== selfPlayerIndex ||
    playerIndex !== currentPlayerIndex;

  if (typeof playerIndex === "number" && typeof type === "string") {
    let iconClass = "";
    if (notAllowed) {
      iconClass = "blocked";
    } else {
      iconClass = !isDragging ? "draggable" : "dragging";
    }
    let selectedClass = "";
    const gamePositionKey = convertToGamePositionKey({ row, column });
    if (selectedPiece) {
      selectedClass =
        gamePositionKey ===
        convertToGamePositionKey({
          row: selectedPiece.selectedPiece.row,
          column: selectedPiece.selectedPiece.column,
        })
          ? "selected"
          : "";
    }
    piece = (
      <div
        className={`piece ${iconClass} ${selectedClass}`}
        ref={pieceRef}
        onMouseDown={(e) => {
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
        }}
      >
        {<Image src={determineImage(type, playerIndex) ?? ""} alt={type} />}
      </div>
    );
  }
  return piece;
}
