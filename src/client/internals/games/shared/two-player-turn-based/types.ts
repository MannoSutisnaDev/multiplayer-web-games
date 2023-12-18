import { Dispatch, SetStateAction } from "react";

import { InterruptingMessage } from "@/server/games/types";
import { BasePlayerModelInterface } from "@/shared/types/socket-communication/games/game-types";

export interface TwoPlayerTurnBasedProps {
  leaveFunction: () => void;
}

export interface TwoPlayerTurnBasedContextInterface<
  T extends BasePlayerModelInterface = BasePlayerModelInterface,
> {
  isLoaded: boolean;
  setIsLoaded: Dispatch<SetStateAction<boolean>>;
  players: T[];
  setPlayers: Dispatch<SetStateAction<T[]>>;
  currentPlayerIndex: number;
  setCurrentPlayerIndex: Dispatch<SetStateAction<number>>;
  selfPlayerIndex: number;
  setSelfPlayerIndex: Dispatch<SetStateAction<number>>;
  interruptingMessage: InterruptingMessage | null;
  setInterruptingMessage: Dispatch<SetStateAction<InterruptingMessage | null>>;
}
