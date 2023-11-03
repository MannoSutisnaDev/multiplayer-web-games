import { GameTypes } from "@/shared/types/socket-communication/general";
export const UpdateUserData = "UpdateUserData";

export interface GeneralSocketFunctions {
  ServerToClient: {
    [UpdateUserData]: ({
      username,
      sessionId,
      lobbyId,
      gameType,
    }: {
      username?: string;
      sessionId?: string;
      lobbyId?: string;
      gameType: GameTypes | null;
    }) => void;
  };
}
