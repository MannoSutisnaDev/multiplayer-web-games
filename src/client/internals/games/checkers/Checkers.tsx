"use client";

import { time } from "console";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

import { BodyContextWrapper } from "@/client/internals/body/BodyContext";
import {
  CheckersContextInterface,
  SelectedPieceData,
} from "@/client/internals/body/types";
import Board from "@/client/internals/games/checkers/Board";
import InterruptingMessageModal from "@/client/internals/modal/implementation/InterruptingMessageModal";
import { socket } from "@/client/internals/socket/socket";
import { ToastMessageContextWrapper } from "@/client/internals/toast-messages/ToastMessageContext";
import { QuadrilateralInterface } from "@/client/types";
import {
  convertToGamePosition,
  convertToGamePositionKey,
  generateQuadrilateral,
  getClientXAndY,
  quadrilateralOverlapPercentage,
} from "@/client/utils";
import { CheckersGameDataInterface } from "@/server/games/types";
import {
  COLUMNS,
  ROWS,
} from "@/shared/types/socket-communication/games/game-types";
import { debounce } from "@/shared/utility";

export const CheckersContextWrapper = createContext<CheckersContextInterface>({
  isDragging: false,
  setSelectedPiece: (selectedPiece: SelectedPieceData) => {},
  selectedPiece: null,
  selectedPieceRef: null,
  calculatingAreasRef: null,
  gamePositionsRef: null,
  areasDataRef: null,
  calculateAreasData: () => {},
  gameData: null,
  timestamp: null,
});

export default function Checkers() {
  const { addErrorMessage } = useContext(ToastMessageContextWrapper);
  const { setBodyClass, bodyRef } = useContext(BodyContextWrapper);
  const [gameData, setGameData] = useState<CheckersGameDataInterface | null>(
    null
  );
  const calculatingAreasRef = useRef<boolean>(false);
  const gamePositionsRef = useRef<Map<string, HTMLElement>>(new Map());
  const areasDataRef = useRef<Map<string, QuadrilateralInterface>>(new Map());
  const [isDragging, setIsDragging] = useState(false);
  const selectedPieceRef = useRef<SelectedPieceData | null>(null);
  const [selectedPiece, setSelectedPiece] = useState<SelectedPieceData | null>(
    null
  );
  const [timestamp, setTimestamp] = useState<number | null>(
    new Date().getTime()
  );
  const signaledReady = useRef<boolean>(false);

  const setSelectedPieceFull = useCallback(
    (selectedPiece: SelectedPieceData | null, drop: boolean = false) => {
      if (selectedPiece) {
        if (drop) {
          selectedPiece.dropped = true;
          setBodyClass("");
          setIsDragging(false);
        } else {
          selectedPiece.dropped = false;
          setBodyClass("dragging");
          setIsDragging(true);
        }
        selectedPieceRef.current = selectedPiece;
        setSelectedPiece(selectedPiece);
      } else {
        setBodyClass("");
        setIsDragging(false);
        selectedPieceRef.current = null;
        setSelectedPiece(null);
      }
    },
    [setBodyClass]
  );

  const calculateAreasDataProto = useCallback(() => {
    const gamePositions = gamePositionsRef?.current;
    const areasData = areasDataRef?.current;
    if (
      !gamePositions ||
      gamePositions.size < ROWS * COLUMNS ||
      !areasData ||
      calculatingAreasRef.current
    ) {
      return;
    }
    calculatingAreasRef.current = true;
    for (const [key, value] of gamePositions.entries()) {
      const rect = value.getBoundingClientRect();
      areasData.set(
        key,
        generateQuadrilateral(rect.x, rect.y, rect.width, rect.height)
      );
    }
    calculatingAreasRef.current = false;
  }, []);

  const calculateAreasData = useCallback(debounce(calculateAreasDataProto), [
    calculateAreasDataProto,
  ]);

  useEffect(() => {
    socket.on("GenericResponseError", ({ error }: { error: string }) => {
      setSelectedPieceFull(null);
      setTimestamp(new Date().getTime());
      addErrorMessage?.(error);
    });
    socket.on("CheckersGameStateUpdateResponse", ({ gameData }) => {
      setGameData(gameData);
      setSelectedPieceFull(null);
      setTimestamp(new Date().getTime());
    });

    if (!signaledReady.current) {
      signaledReady.current = true;
      socket.emit("ReadyToPlay");
      socket.emit("RequestGameStateUpdate");
    }

    return () => {
      socket.removeAllListeners("GenericResponseError");
    };
  }, [addErrorMessage, setSelectedPieceFull]);

  useEffect(() => {
    const resizeListener = () => {
      calculateAreasData();
    };
    window.addEventListener("resize", resizeListener);
    return () => {
      window.removeEventListener("resize", resizeListener);
    };
  }, [calculateAreasData]);

  useEffect(() => {
    const body = bodyRef?.current;
    if (!body) {
      return;
    }
    const mouseMove = (e: Event) => {
      e.preventDefault();
      const piece = selectedPieceRef.current?.element;
      if (!isDragging || !piece) {
        return;
      }
      const { clientX, clientY } = getClientXAndY(e);
      const rect = piece.getBoundingClientRect();
      const deltaX = piece.offsetLeft + (clientX - rect.x - rect.width / 2);
      const deltaY = piece.offsetTop + (clientY - rect.y - rect.height / 2);
      piece.style.left = deltaX + "px";
      piece.style.top = deltaY + "px";
    };
    const mouseUp = (e: Event) => {
      e.preventDefault();
      const piece = selectedPieceRef.current;
      if (!isDragging || !piece) {
        return;
      }
      const pieceElement = piece.element;
      const pieceRect = pieceElement.getBoundingClientRect();
      const pieceQuadrilateral = generateQuadrilateral(
        pieceRect.x,
        pieceRect.y,
        pieceRect.width,
        pieceRect.height
      );
      const highestPercentage: {
        key: string | null;
        percentage: number;
      } = {
        key: null,
        percentage: Number.MIN_VALUE,
      };
      for (const [key, cellQuadrilateral] of areasDataRef.current.entries()) {
        const overlapPercentage = quadrilateralOverlapPercentage(
          pieceQuadrilateral,
          cellQuadrilateral
        );
        if (
          overlapPercentage > 60 &&
          overlapPercentage > highestPercentage.percentage
        ) {
          highestPercentage.percentage = overlapPercentage;
          highestPercentage.key = key;
        }
      }

      if (
        !highestPercentage.key ||
        convertToGamePositionKey({
          row: piece.selectedPiece.row,
          column: piece.selectedPiece.column,
        }) === highestPercentage.key
      ) {
        pieceElement.style.left = "initial";
        pieceElement.style.top = "initial";
        setSelectedPieceFull(null);
      } else {
        const entry = areasDataRef.current.get(highestPercentage.key);
        const gamePosition = gamePositionsRef.current.get(
          highestPercentage.key
        );
        const currentArea = areasDataRef.current.get(
          convertToGamePositionKey({
            column: piece.selectedPiece.column,
            row: piece.selectedPiece.row,
          })
        );
        if (!entry || !gamePosition || !currentArea) {
          return;
        }
        const deltaX =
          entry.startX -
          currentArea.startX +
          entry.width / 2 -
          pieceRect.width / 2;
        const deltaY =
          entry.startY -
          currentArea.startY +
          entry.height / 2 -
          pieceRect.height / 2;
        pieceElement.style.left = `${deltaX}px`;
        pieceElement.style.top = `${deltaY}px`;
        if (!selectedPieceRef.current) {
          return;
        }
        const { row: targetRow, column: targetColumn } = convertToGamePosition(
          highestPercentage.key
        );
        if (selectedPiece) {
          const newSelectedPiece = {
            ...selectedPiece,
          };
          setSelectedPieceFull(newSelectedPiece, true);
        }
        socket.emit("MovePiece", {
          origin: {
            row: selectedPieceRef.current.selectedPiece.row,
            column: selectedPieceRef.current.selectedPiece.column,
          },
          target: {
            row: parseInt(targetRow),
            column: parseInt(targetColumn),
          },
        });
      }
    };
    body.addEventListener("mousemove", mouseMove);
    body.addEventListener("mouseup", mouseUp);
    return () => {
      if (!body) {
        return;
      }
      body.removeEventListener("mousemove", mouseMove);
      body.removeEventListener("mouseup", mouseUp);
    };
  }, [bodyRef, isDragging, selectedPiece, setSelectedPieceFull]);

  let topPlayerClass: string = "";
  let topPlayerName: string = "";
  let bottomPlayerClass: string = "";
  let bottomPlayerName: string = "";
  if (gameData?.selfPlayerIndex === 0) {
    topPlayerClass = `player-label ${
      gameData.currentPlayerIndex === 1 ? "selected" : ""
    }`;
    topPlayerName = gameData.players[1].name;
    bottomPlayerClass = `player-label ${
      gameData.currentPlayerIndex === 0 ? "selected" : ""
    }`;
    bottomPlayerName = gameData.players[0].name;
  } else if (gameData?.selfPlayerIndex === 1) {
    topPlayerClass = `player-label ${
      gameData.currentPlayerIndex === 0 ? "selected" : ""
    }`;
    topPlayerName = gameData.players[0].name;
    bottomPlayerClass = `player-label ${
      gameData.currentPlayerIndex === 1 ? "selected" : ""
    }`;
    bottomPlayerName = gameData.players[1].name;
  }

  return (
    <CheckersContextWrapper.Provider
      value={{
        isDragging,
        setSelectedPiece: setSelectedPieceFull,
        calculatingAreasRef,
        gamePositionsRef,
        areasDataRef,
        calculateAreasData,
        selectedPiece,
        selectedPieceRef,
        gameData,
        timestamp,
      }}
    >
      <InterruptingMessageModal
        show={!!gameData?.interruptingMessage}
        title={gameData?.interruptingMessage?.title ?? ""}
        message={gameData?.interruptingMessage?.message ?? ""}
      />
      <div className="main-wrapper">
        <button
          className="leave-button"
          onClick={() => {
            if (
              !confirm(
                "Are you sure want to leave this game? The game will be deleted."
              )
            ) {
              return;
            }
            socket.emit("LeaveGame");
          }}
        >
          Leave game
        </button>
        {gameData === null ? (
          <div className="main">Loading...</div>
        ) : (
          <div className="main">
            <div className="game-container">
              <div className="player-label-container">
                <div className={topPlayerClass}>{topPlayerName}</div>
              </div>
              <Board key={`board-${timestamp}`} gameData={gameData} />
              <div className="player-label-container">
                <div className={bottomPlayerClass}>{bottomPlayerName}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </CheckersContextWrapper.Provider>
  );
}
