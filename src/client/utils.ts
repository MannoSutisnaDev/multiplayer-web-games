import { QuadrilateralInterface } from "@/client/types";
import { GamePosition } from "@/shared/types/socket-communication/games/game-types";

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
  evt: React.SyntheticEvent
): { clientX: number; clientY: number } => {
  let clientY: number;
  let clientX: number;
  if (evt.nativeEvent instanceof TouchEvent) {
    clientY = evt.nativeEvent.touches[0].clientY;
    clientX = evt.nativeEvent.touches[0].clientX;
  } else if (evt.nativeEvent instanceof MouseEvent) {
    clientY = evt.nativeEvent.clientY;
    clientX = evt.nativeEvent.clientX;
  } else {
    throw new Error("Invalid event to fetch client X and Y");
  }
  return {
    clientX,
    clientY,
  };
};
