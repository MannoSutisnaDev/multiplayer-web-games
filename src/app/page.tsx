"use client";

import { useRouter } from "next/navigation";
import { useContext, useEffect, useState } from "react";

import { socket } from "@/app/internals/socket/socket";
import { SocketContextWrapper } from "@/app/internals/socket/SocketContext";
import { ToastMessageContextWrapper } from "@/app/internals/toast-messages/ToastMessageContext";

export default function Home() {
  const router = useRouter();
  const { addErrorMessage } = useContext(ToastMessageContextWrapper);
  const { setSessionId, setUsername: setUsernameContext } =
    useContext(SocketContextWrapper);
  const [username, setUsername] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    socket.on("EnterUsernameResponseSuccess", ({ sessionId, username }) => {
      setIsSubmitting(false);
      if (!sessionId) {
        return;
      }
      setUsernameContext(username);
      socket.auth = { sessionId };
      sessionStorage.setItem("sessionId", sessionId);
      setSessionId(sessionId);
    });
    socket.on("GenericResponseError", ({ error }) => {
      setIsSubmitting(false);
      addErrorMessage?.(error);
    });
    return () => {
      socket.removeAllListeners("EnterUsernameResponseSuccess");
      socket.removeAllListeners("GenericResponseError");
    };
  }, [addErrorMessage, router, setUsernameContext, setSessionId]);

  return (
    <div className="enter-username">
      <h1 className="title">Multiplayer web games</h1>
      <h2 className="sub-title">Enter a username</h2>
      <div className="container">
        <input
          type="text"
          id="username"
          className="username-input"
          placeholder="username"
          value={username}
          autoComplete="off"
          disabled={isSubmitting}
          onChange={(e) => setUsername(e.target.value)}
        />
        <button
          id="submit"
          className="submit-button"
          disabled={isSubmitting}
          onClick={async () => {
            await setIsSubmitting(true);
            if (!username) {
              addErrorMessage?.("Username can't be empty");
              await setIsSubmitting(false);
              return;
            }
            socket.emit("EnterUsername", { username });
          }}
        >
          Submit
        </button>
      </div>
    </div>
  );
}
