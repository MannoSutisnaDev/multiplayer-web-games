export const UpdateUserData = "UpdateUserData";

export interface GeneralSocketFunctions {
  ServerToClient: {
    [UpdateUserData]: ({
      sessionId,
      lobbyId,
    }: {
      sessionId?: string;
      lobbyId?: string;
    }) => void;
  };
}
