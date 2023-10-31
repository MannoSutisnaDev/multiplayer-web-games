import { GenericErrorResponseFunction } from "../general";

export const ENTER_USERNAME = 'EnterSession';
export const ENTER_USERNAME_RESPONSE_SUCCESS = 'EnterSessionResponseSuccess';
export const ENTER_USERNAME_RESPONSE_ERROR = 'EnterSessionResponseError';

export interface PhaseEnterUsernameTypes {
  ClientToServer: {
    [ENTER_USERNAME]: ({username}: {username: string}) => void
  },
  ServerToClient: {
    [ENTER_USERNAME_RESPONSE_SUCCESS]: ({sessionId}: {sessionId: string}) => void
    [ENTER_USERNAME_RESPONSE_ERROR]: GenericErrorResponseFunction
  }
}