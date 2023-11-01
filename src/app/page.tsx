"use client";

import { useRouter } from "next/navigation";
import { useContext, useEffect, useState } from "react";

import { socket } from "@/app/internals/socket/socket";
import { SocketContextWrapper } from "@/app/internals/socket/SocketContext";
import { ToastMessageContextWrapper } from "@/app/internals/toast-messages/ToastMessageContext";

export default function Home() {
  const router = useRouter();
  const { addErrorMessage } = useContext(ToastMessageContextWrapper);
  const { setSessionId } = useContext(SocketContextWrapper);
  const [username, setUsername] = useState<string>("");

  useEffect(() => {
    socket.on("EnterUsernameResponseSuccess", ({ sessionId }) => {
      if (!sessionId) {
        return;
      }
      socket.auth = { sessionId };
      sessionStorage.setItem("sessionId", sessionId);
      setSessionId(sessionId);
      router.replace("/lobbies");
    });
    socket.on("EnterUsernameResponseError", ({ error }) => {
      addErrorMessage?.(error);
    });
    return () => {
      socket.removeAllListeners("EnterUsernameResponseSuccess");
      socket.removeAllListeners("EnterUsernameResponseError");
    };
  }, [addErrorMessage, router, setSessionId]);

  return (
    <div className="login">
      <h1>Set username</h1>
      <input
        type="text"
        placeholder="enter a username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
      <button
        className="btn"
        onClick={() => {
          if (!username) {
            addErrorMessage?.("Username can't be empty");
            return;
          }
          socket.emit("EnterUsername", { username });
        }}
      >
        Submit
      </button>
    </div>
  );
}
