import "@/client/styling/main.scss";

import type { Metadata } from "next";

import GlobalContext from "@/client/internals/global/GlobalContext";
import RouteGuard from "@/client/internals/route-guard/RouteGuard";
import SocketContext from "@/client/internals/socket/SocketContext";
import ToastMessageContext from "@/client/internals/toast-messages/ToastMessageContext";

export const metadata: Metadata = {
  title: "Multiplayer Web Games",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <GlobalContext>
        <ToastMessageContext>
          <SocketContext>
            <RouteGuard>{children}</RouteGuard>
          </SocketContext>
        </ToastMessageContext>
      </GlobalContext>
    </html>
  );
}
