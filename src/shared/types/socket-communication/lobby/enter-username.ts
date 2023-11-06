import { GenericErrorResponseFunction, GenericResponseError } from "../general";

export const EnterUsername = "EnterUsername";
export const EnterUsernameResponseSuccess = "EnterUsernameResponseSuccess";
export const EnterUsernameResponseError = "EnterUsernameResponseError";

export const PhaseIdEnterUsername = "enter-username";

export interface PhaseEnterUsernameTypes {
  ClientToServer: {
    [EnterUsername]: ({ username }: { username: string }) => void;
  };
  ServerToClient: {
    [EnterUsernameResponseSuccess]: ({
      sessionId,
    }: {
      sessionId: string;
      username: string;
    }) => void;
    [GenericResponseError]: GenericErrorResponseFunction;
  };
}
