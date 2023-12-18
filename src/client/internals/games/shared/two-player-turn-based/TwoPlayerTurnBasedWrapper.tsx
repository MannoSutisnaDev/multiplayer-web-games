"use client";

import { createContext, PropsWithChildren, useState } from "react";

import {
  TwoPlayerTurnBasedContextInterface,
  TwoPlayerTurnBasedProps,
} from "@/client/internals/games/shared/two-player-turn-based/types";
import InterruptingMessageModal from "@/client/internals/modal/implementation/InterruptingMessageModal";
import { InterruptingMessage } from "@/server/games/types";
import { BasePlayerModelInterface } from "@/shared/types/socket-communication/games/game-types";

export const TwoPlayerTurnBasedContext =
  createContext<TwoPlayerTurnBasedContextInterface>({
    isLoaded: false,
    setIsLoaded: () => {},
    players: [],
    setPlayers: () => {},
    currentPlayerIndex: -1,
    setCurrentPlayerIndex: () => {},
    selfPlayerIndex: -1,
    setSelfPlayerIndex: () => {},
    interruptingMessage: null,
    setInterruptingMessage: () => {},
  });

export default function TwoPlayerTurnBasedWrapper<
  P extends TwoPlayerTurnBasedProps,
>(WrappedComponent: React.ComponentType<P>) {
  const TwoPlayerTurnBased = (props: P) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [players, setPlayers] = useState<BasePlayerModelInterface[]>([]);
    const [currentPlayerIndex, setCurrentPlayerIndex] = useState(-1);
    const [selfPlayerIndex, setSelfPlayerIndex] = useState(-1);
    const [interruptingMessage, setInterruptingMessage] =
      useState<InterruptingMessage | null>(null);

    let topPlayerClass: string = "";
    let topPlayerName: string = "";
    let bottomPlayerClass: string = "";
    let bottomPlayerName: string = "";

    if (selfPlayerIndex === 0) {
      topPlayerClass = `player-label ${
        currentPlayerIndex === 1 ? "selected" : ""
      }`;
      topPlayerName = players[1].name;
      bottomPlayerClass = `player-label ${
        currentPlayerIndex === 0 ? "selected" : ""
      }`;
      bottomPlayerName = players[0].name;
    } else if (selfPlayerIndex === 1) {
      topPlayerClass = `player-label ${
        currentPlayerIndex === 0 ? "selected" : ""
      }`;
      topPlayerName = players[0].name;
      bottomPlayerClass = `player-label ${
        currentPlayerIndex === 1 ? "selected" : ""
      }`;
      bottomPlayerName = players[1].name;
    }

    return (
      <TwoPlayerTurnBasedContext.Provider
        value={{
          isLoaded,
          setIsLoaded,
          players,
          setPlayers,
          currentPlayerIndex,
          setCurrentPlayerIndex,
          selfPlayerIndex,
          setSelfPlayerIndex,
          interruptingMessage,
          setInterruptingMessage,
        }}
      >
        <InterruptingMessageModal
          show={!!interruptingMessage}
          title={interruptingMessage?.title ?? ""}
          message={interruptingMessage?.message ?? ""}
        />
        <div className="main-wrapper">
          <button className="leave-button" onClick={props.leaveFunction}>
            Leave game
          </button>
          {!isLoaded ? (
            <>
              <div className="main">Loading...</div>
              <div className="hide">
                <WrappedComponent {...props} />
              </div>
            </>
          ) : (
            <div className="main">
              <div className="game-container">
                <div className="player-label-container">
                  <div className={topPlayerClass}>{topPlayerName}</div>
                </div>
                <WrappedComponent {...props} />
                <div className="player-label-container">
                  <div className={bottomPlayerClass}>{bottomPlayerName}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </TwoPlayerTurnBasedContext.Provider>
    );
  };
  return TwoPlayerTurnBased;
}
