import ChessGame from "@/server/games/chess/ChessGame";
import { PIECE_TYPES } from "@/shared/types/socket-communication/games/chess";

import { PieceBuilder } from "./general";

export const knightQueenScenario = (game: ChessGame) => {
  game.cells[0][0].playerPiece = PieceBuilder(
    PIECE_TYPES.KING,
    0,
    0,
    1,
    game.generateFetchGameFunction()
  );

  game.cells[3][1].playerPiece = PieceBuilder(
    PIECE_TYPES.QUEEN,
    3,
    1,
    1,
    game.generateFetchGameFunction()
  );

  game.cells[6][5].playerPiece = PieceBuilder(
    PIECE_TYPES.KNIGHT,
    6,
    5,
    1,
    game.generateFetchGameFunction()
  );

  game.cells[7][3].playerPiece = PieceBuilder(
    PIECE_TYPES.KING,
    7,
    3,
    0,
    game.generateFetchGameFunction()
  );
};

export const inTheWayScenario = (game: ChessGame) => {
  game.cells[0][0].playerPiece = PieceBuilder(
    PIECE_TYPES.KING,
    0,
    0,
    1,
    game.generateFetchGameFunction()
  );

  game.cells[1][1].playerPiece = PieceBuilder(
    PIECE_TYPES.ROOK,
    0,
    1,
    1,
    game.generateFetchGameFunction()
  );

  game.cells[6][6].playerPiece = PieceBuilder(
    PIECE_TYPES.QUEEN,
    6,
    6,
    0,
    game.generateFetchGameFunction()
  );

  game.cells[7][0].playerPiece = PieceBuilder(
    PIECE_TYPES.KING,
    7,
    0,
    0,
    game.generateFetchGameFunction()
  );
};

export const checkScenario1 = (game: ChessGame) => {
  game.cells[0][0].playerPiece = PieceBuilder(
    PIECE_TYPES.KING,
    0,
    0,
    1,
    game.generateFetchGameFunction()
  );

  game.cells[0][1].playerPiece = PieceBuilder(
    PIECE_TYPES.ROOK,
    0,
    1,
    1,
    game.generateFetchGameFunction()
  );

  game.cells[0][2].playerPiece = PieceBuilder(
    PIECE_TYPES.KNIGHT,
    0,
    2,
    1,
    game.generateFetchGameFunction()
  );

  game.cells[6][5].playerPiece = PieceBuilder(
    PIECE_TYPES.QUEEN,
    6,
    5,
    0,
    game.generateFetchGameFunction()
  );

  game.cells[7][6].playerPiece = PieceBuilder(
    PIECE_TYPES.QUEEN,
    7,
    6,
    0,
    game.generateFetchGameFunction()
  );

  game.cells[7][0].playerPiece = PieceBuilder(
    PIECE_TYPES.KING,
    7,
    0,
    0,
    game.generateFetchGameFunction()
  );
};
