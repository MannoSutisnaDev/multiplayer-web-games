export interface MessageContextInterface {
  addMessageToQueue: ((message: Message) => void) | null;
  addSuccessMessage: ((mainText: string, subText?: string) => void) | null;
  addErrorMessage: ((mainText: string, subText?: string) => void) | null;
}

export interface Message {
  createdTimestamp: number;
  type: 'success' | 'error';
  main: string;
  sub?: string;
}
