import { motion, useAnimate, usePresence } from "framer-motion";
import { useEffect } from "react";
import { createPortal } from "react-dom";

import { Message } from "@/client/internals/toast-messages/types";

interface Props {
  message: Message | null;
  removeMessage: () => Promise<void>;
}

export default function ToastMessageComponent({
  message,
  removeMessage,
}: Props) {
  const [isPresent, safeToRemove] = usePresence();
  const [scope, animate] = useAnimate();

  useEffect(() => {
    if (!scope.current) {
      return;
    }
    if (isPresent) {
      const enterAnimation = async () => {
        animate(
          scope.current,
          {
            y: 0,
          },
          {
            duration: 0.5,
            ease: "easeIn",
          }
        );
      };
      enterAnimation();
    } else {
      const exitAnimation = async () => {
        await animate(
          scope.current,
          {
            y: -200,
          },
          {
            duration: 0.5,
            ease: "easeOut",
          }
        );
        safeToRemove();
      };
      exitAnimation();
    }
  }, [isPresent, scope]);

  useEffect(() => {
    let timeout: NodeJS.Timeout | null = null;
    if (message?.type === "error") {
      timeout = setTimeout(() => {
        removeMessage();
      }, 2000);
    }
    return () => {
      if (timeout) {
        clearTimeout(timeout);
      }
    };
  }, [message?.createdTimestamp]);

  if (!message) {
    return;
  }
  return (
    <>
      {createPortal(
        <motion.div
          ref={scope}
          initial={{ y: -200 }}
          className={`message ${
            message.type === "error" ? "error" : "success"
          }`}
        >
          <div className="message-inner">
            <div className="wrapper">
              <div className="text-wrapper">
                <span className="main-text">{message.main}</span>&nbsp;
                <span className="sub">{message.sub}</span>
              </div>
            </div>
            <div className="close" onClick={removeMessage}>
              &times;
            </div>
          </div>
        </motion.div>,
        document.body
      )}
    </>
  );
}
