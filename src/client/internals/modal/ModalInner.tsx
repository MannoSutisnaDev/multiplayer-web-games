"use client";

import { motion, useAnimate, usePresence } from "framer-motion";
import { useEffect, useRef } from "react";
import { PropsWithChildren } from "react";

import { BaseModalProps } from "@/client/types";

export default function ModalInner({
  children,
  close,
}: PropsWithChildren<BaseModalProps>) {
  const [isPresent, safeToRemove] = usePresence();
  const [scope, animate] = useAnimate();
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isPresent) {
      const enterAnimation = async () => {
        animate(scope.current, { opacity: 1 }, { duration: 0.2 });
        animate(
          ".content",
          {
            y: 0,
          },
          {
            duration: 0.2,
            ease: "easeIn",
          }
        );
      };
      enterAnimation();
    } else {
      const exitAnimation = async () => {
        const content = contentRef.current;
        let animateContent = true;
        if (content) {
          const rect = content.getBoundingClientRect();
          animateContent = rect.height > 0;
        }
        if (animateContent) {
          await animate(
            ".content",
            {
              y: 1000,
            },
            {
              ease: "easeIn",
            }
          );
        }
        await animate(scope.current, { opacity: 0 });
        safeToRemove();
      };
      exitAnimation();
    }
  }, [isPresent]);

  return (
    <motion.div
      ref={scope}
      className="modal-backdrop"
      initial={{ opacity: 0 }}
      onClick={() => close()}
    >
      <div className="modal-inner">
        <motion.div
          ref={contentRef}
          initial={{ y: 1000 }}
          className={"content"}
          onClick={(e) => e.stopPropagation()}
        >
          {children}
        </motion.div>
      </div>
    </motion.div>
  );
}
