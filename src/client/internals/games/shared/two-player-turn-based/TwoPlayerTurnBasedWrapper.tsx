"use client";

import { createContext, useContext, useState } from "react";

import {
  TwoPlayerTurnBasedContextInterface,
  TwoPlayerTurnBasedProps,
} from "@/client/internals/games/shared/two-player-turn-based/types";
import InterruptingMessageModal from "@/client/internals/modal/implementation/InterruptingMessageModal";
import { SocketContextWrapper } from "@/client/internals/socket/SocketContext";
import { InterruptingMessage, PlayerData } from "@/server/games/types";
import { BasePlayerModelInterface } from "@/shared/types/socket-communication/games/game-types";

export const TwoPlayerTurnBasedContext =
  createContext<TwoPlayerTurnBasedContextInterface>({
    isLoaded: false,
    setIsLoaded: () => {},
    players: [],
    setPlayers: () => {},
    spectators: [],
    setSpectators: () => {},
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
    const [spectators, setSpectators] = useState<PlayerData[]>([]);
    const [currentPlayerIndex, setCurrentPlayerIndex] = useState(-1);
    const [selfPlayerIndex, setSelfPlayerIndex] = useState(-1);
    const [interruptingMessage, setInterruptingMessage] =
      useState<InterruptingMessage | null>(null);

    const { sessionId } = useContext(SocketContextWrapper);

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

    const isSpectator = !!spectators.filter(
      (spectator) => spectator.id === sessionId
    )[0];

    const footer = (
      <div className="footer">
        <button
          className="leave-button"
          onClick={() => {
            props?.leaveFunction?.(
              isLoaded && !interruptingMessage && !isSpectator
            );
          }}
          onTouchStart={() => {
            props?.leaveFunction?.(
              isLoaded && !interruptingMessage && !isSpectator
            );
          }}
        >
          Leave game
        </button>
        {/* <button
          className="reset-button"
          onClick={() => {
            props?.resetFunction?.();
          }}
          onTouchStart={() => {
            props?.resetFunction?.();
          }}
        >
          Reset
        </button> */}
      </div>
    );

    return (
      <TwoPlayerTurnBasedContext.Provider
        value={{
          isLoaded,
          setIsLoaded,
          players,
          setPlayers,
          spectators,
          setSpectators,
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
          subContent={footer}
        />
        <div className="main-wrapper">
          <div className="header"></div>
          {!isLoaded ? (
            <>
              <div className="main">Loading...</div>
              <div className="hide">
                <WrappedComponent {...props} />
              </div>
            </>
          ) : (
            <div className={`main ${isSpectator ? "spectating" : ""}`}>
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
          {!interruptingMessage && footer}
        </div>
      </TwoPlayerTurnBasedContext.Provider>
    );
  };
  return TwoPlayerTurnBased;
}
