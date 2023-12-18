import { Dispatch, RefObject, SetStateAction } from "react";

export interface BodyContextInterface {
  bodyClass: string;
  setBodyClass: Dispatch<SetStateAction<string>>;
  bodyRef: RefObject<HTMLBodyElement> | null;
}
