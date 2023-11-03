export const GenericResponseError = "GenericResponseError";

export type GenericErrorResponseFunction = ({
  error,
}: {
  error: string;
}) => void;

export enum GameTypes {
  Checkers = "Checkers",
  Chess = "Chess",
  Poker = "Poker",
  Pong = "Pong",
  TicTacToe = "Tic-Tac-Toe",
  Tetris = "Tetris",
  Snake = "Multiplayer Snake",
}

export const GameTypesData = {
  [GameTypes.Checkers]: {
    name: "Checkers",
    maxPlayers: 2,
  },
};
