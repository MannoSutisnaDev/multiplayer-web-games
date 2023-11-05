import { useContext, useEffect, useRef, useState } from "react";

import { socket } from "@/client/internals/socket/socket";
import { ToastMessageContextWrapper } from "@/client/internals/toast-messages/ToastMessageContext";

export default function Checkers() {
  const { addErrorMessage } = useContext(ToastMessageContextWrapper);
  const [gameData, setGameData] = useState<{
    initialized: boolean;
    variable: string;
  } | null>(null);
  const [textField, setTextField] = useState(gameData?.variable ?? "");
  const signaledReady = useRef<boolean>(false);

  useEffect(() => {
    socket.on("GenericResponseError", ({ error }: { error: string }) => {
      addErrorMessage?.(error);
    });
    socket.on("CheckersGameStateUpdateResponse", (gameData) => {
      setGameData(gameData);
      setTextField(gameData.variable);
    });

    if (!signaledReady.current) {
      signaledReady.current = true;
      socket.emit("ReadyToPlay");
      socket.emit("RequestGameStateUpdate");
    }

    return () => {
      socket.removeAllListeners("GenericResponseError");
    };
  }, [addErrorMessage]);

  return (
    <div>
      <h1>Checkers</h1>
      <div>{gameData !== null ? "Done loading" : "Loading..."}</div>
      <div>
        <input
          type="text"
          value={textField}
          onChange={(e) => setTextField(e.target.value)}
        />
        <button
          onClick={() => {
            socket.emit("Test", textField);
          }}
        >
          Change state
        </button>
      </div>
    </div>
  );
}
