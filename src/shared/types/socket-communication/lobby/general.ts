import { GameTypes } from "@/shared/types/socket-communication/general";
export const UpdateUserData = "UpdateUserData";
export const DeleteSessionId = "DeleteSessionId";
export const Disconnect = "disconnect";

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
    [DeleteSessionId]: () => void;
  };
  ClientToServer: {
    [Disconnect]: () => void;
  };
}
