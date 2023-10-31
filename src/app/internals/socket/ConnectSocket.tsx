'use client';

import { PropsWithChildren, useEffect } from "react";

import { establishSocketConnection } from "@/app/internals/socket/socket";

export default function ConnectSocket({children}: PropsWithChildren) {
  useEffect(() => {
    establishSocketConnection();
  }, [])
  return <>
    {children}
  </>
}