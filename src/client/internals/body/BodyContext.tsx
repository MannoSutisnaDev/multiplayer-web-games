"use client";

import { createContext, PropsWithChildren, useRef, useState } from "react";

import { BodyContextInterface } from "@/client/internals/body/types";

export const BodyContextWrapper = createContext<BodyContextInterface>({
  bodyClass: "",
  setBodyClass: () => {},
  bodyRef: null,
});

export default function BodyContext({ children }: PropsWithChildren) {
  const [bodyClass, setBodyClass] = useState("");
  const bodyRef = useRef<HTMLBodyElement>(null);

  return (
    <BodyContextWrapper.Provider
      value={{
        bodyClass,
        setBodyClass,
        bodyRef,
      }}
    >
      <body ref={bodyRef} className={`${bodyClass}`}>
        {children}
      </body>
    </BodyContextWrapper.Provider>
  );
}
