import { type Socket } from "socket.io-client";

import {
  ClientToServerEvents,
  ServerToClientEvents,
} from "@/shared/types/socket-communication/types";

export interface SocketClientSide
  extends Socket<ServerToClientEvents, ClientToServerEvents> {
  data: {
    sessionId?: string;
    lobbyId?: string;
    gameIsPlaying?: boolean;
  };
}

export interface BaseModalProps {
  show: boolean;
  modalInnerExtraClass?: string;
  close?: () => void;
}

export interface Dimensions {
  x: number;
  y: number;
  w: number;
  h: number;
}

export function getDimensionDataForElement(
  element: HTMLElement,
  containerElement?: HTMLElement
): Dimensions {
  let boundingClientRect = element.getBoundingClientRect();
  let x = boundingClientRect.x;
  let y = boundingClientRect.y;
  if (containerElement) {
    x -= containerElement.offsetLeft;
    y -= containerElement.offsetTop;
  }
  return {
    x,
    y,
    w: boundingClientRect.width,
    h: boundingClientRect.height,
  };
}

export interface QuadrilateralInterface {
  startX: number;
  endX: number;
  startY: number;
  endY: number;
  width: number;
  height: number;
}
