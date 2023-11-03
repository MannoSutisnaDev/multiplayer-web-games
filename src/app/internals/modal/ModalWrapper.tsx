"use client";

import { AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";

import ModalInner from "@/app/internals/modal/ModalInner";
import { BaseModalProps } from "@/app/types";

export default function ModalWrapper<P extends BaseModalProps>(
  WrappedComponent: React.ComponentType<P>
) {
  const FullPlaylistWithFullScreenWrapper = (props: P) => {
    if (typeof document === "undefined") {
      return;
    }
    return (
      <>
        {createPortal(
          <AnimatePresence mode="wait">
            {props.show && (
              <ModalInner {...props}>
                <WrappedComponent {...props} />
              </ModalInner>
            )}
          </AnimatePresence>,
          document.body
        )}
      </>
    );
  };
  return FullPlaylistWithFullScreenWrapper;
}
