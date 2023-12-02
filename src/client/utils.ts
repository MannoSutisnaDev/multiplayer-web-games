import { QuadrilateralInterface } from "@/client/types";
import { GamePosition } from "@/shared/types/socket-communication/games/game-types";
import { TokenStorage } from "@/shared/types/socket-communication/types";

export function quadrilateralOverlapPercentage(
  quad1: QuadrilateralInterface,
  quad2: QuadrilateralInterface
) {
  const SI =
    Math.max(
      0,
      Math.min(quad1.endX, quad2.endX) - Math.max(quad1.startX, quad2.startX)
    ) *
    Math.max(
      0,
      Math.min(quad1.endY, quad2.endY) - Math.max(quad1.startY, quad2.startY)
    );
  const SA = quad1.width * quad1.height;
  const SU = SA * 2 - SI;
  return (SI / SU) * 100;
}

export function generateQuadrilateral(
  startX: number,
  startY: number,
  width: number,
  height: number
): QuadrilateralInterface {
  return {
    startX: startX,
    endX: startX + width,
    startY: startY,
    endY: startY + height,
    width: width,
    height: height,
  };
}

export function convertToGamePositionKey(gamePosition: GamePosition) {
  return `${gamePosition.column}-${gamePosition.row}`;
}

export function convertToGamePosition(gamePositionKey: string) {
  const splitted = gamePositionKey.split("-");
  return {
    column: splitted[0],
    row: splitted[1],
  };
}

export const getClientXAndY = (
  evt: Event
): { clientX: number; clientY: number } => {
  let clientY: number;
  let clientX: number;
  if (evt instanceof TouchEvent) {
    clientY = evt.touches[0].clientY;
    clientX = evt.touches[0].clientX;
  } else if (evt instanceof MouseEvent) {
    clientY = evt.clientY;
    clientX = evt.clientX;
  } else {
    throw new Error("Invalid event to fetch client X and Y");
  }
  return {
    clientX,
    clientY,
  };
};

export const tokenStorage = () => {
  const tokenStorage = process.env.NEXT_PUBLIC_TOKEN_STORAGE as TokenStorage;
  const getToken = (): string => {
    switch (tokenStorage) {
      case TokenStorage.SessionStorage:
        return sessionStorage.getItem("sessionId") as string;
      case TokenStorage.LocalStorage:
        return localStorage.getItem("sessionId") as string;
      case TokenStorage.Cookie:
        return getCookie("sessionId");
    }
  };

  const setToken = (sessionId: string) => {
    switch (tokenStorage) {
      case TokenStorage.SessionStorage:
        sessionStorage.setItem("sessionId", sessionId);
        break;
      case TokenStorage.LocalStorage:
        localStorage.setItem("sessionId", sessionId);
        break;
      case TokenStorage.Cookie:
        setCookie("sessionId", sessionId);
        break;
    }
  };

  const removeToken = () => {
    switch (tokenStorage) {
      case TokenStorage.SessionStorage:
        sessionStorage.removeItem("sessionId");
        break;
      case TokenStorage.LocalStorage:
        localStorage.removeItem("sessionId");
        break;
      case TokenStorage.Cookie:
        document.cookie =
          "sessionId=; expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;";
        break;
    }
  };
  return {
    getToken,
    setToken,
    removeToken,
  };
};

function setCookie(cname: string, cvalue: string, exdays: number = 1000) {
  const d = new Date();
  d.setTime(d.getTime() + exdays * 24 * 60 * 60 * 1000);
  let expires = "expires=" + d.toUTCString();
  document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

function getCookie(cname: string) {
  let name = cname + "=";
  let decodedCookie = decodeURIComponent(document.cookie);
  let ca = decodedCookie.split(";");
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) == " ") {
      c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
      return c.substring(name.length, c.length);
    }
  }
  return "";
}
