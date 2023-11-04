import { useContext, useEffect, useRef, useState } from "react";

import { socket } from "@/client/internals/socket/socket";
import { ToastMessageContextWrapper } from "@/client/internals/toast-messages/ToastMessageContext";

export default function Checkers() {
  const { addErrorMessage } = useContext(ToastMessageContextWrapper);
  const [gameData, setGameData] = useState<{
    initialized: boolean;
  } | null>(null);
  const readyToPlaySignaled = useRef<boolean>(false);

  useEffect(() => {
    socket.on("GenericResponseError", ({ error }: { error: string }) => {
      addErrorMessage?.(error);
    });
    socket.on("CheckersGameStateUpdateResponse", (gameData) => {
      setGameData(gameData);
    });

    if (!readyToPlaySignaled.current) {
      socket.emit("ReadyToPlay");
      readyToPlaySignaled.current = true;
    }

    return () => {
      socket.removeAllListeners("GenericResponseError");
    };
  }, [addErrorMessage]);

  return (
    <div>
      <h1>Checkers</h1>
      {gameData !== null ? "Done loading" : "Loading..."}
    </div>
  );
}
