"use client";

import { usePathname, useRouter } from "next/navigation";
import { PropsWithChildren, useContext, useEffect } from "react";

import { SocketContextWrapper } from "@/app/internals/socket/SocketContext";

export default function RouteGuard({ children }: PropsWithChildren) {
  const pathname = usePathname();
  const router = useRouter();
  const { sessionId, lobbyId } = useContext(SocketContextWrapper);
  useEffect(() => {
    if (sessionId && lobbyId) {
      const path = `/lobbies/${lobbyId}`;
      if (pathname !== path) {
        console.log("super strange.....");
        router.replace(path);
      }
    } else if (sessionId && !lobbyId) {
      if (pathname !== "/lobbies") {
        router.replace("/lobbies");
      }
    } else if (!sessionId && !lobbyId) {
      if (pathname !== "/") {
        router.replace("/");
      }
    }
  }, [pathname, router, sessionId, lobbyId]);
  return <>{children}</>;
}
