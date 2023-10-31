'use client'

import { AnimatePresence } from 'framer-motion';
import { createContext, PropsWithChildren, useCallback, useRef, useState } from 'react';

import { Message, MessageContextInterface } from '@/app/internals/toast-messages/types';
import MessageComponent from './ToastMessageComponent';

export const ToastMessageContextWrapper = createContext<MessageContextInterface>({
  addMessageToQueue: null,
  addErrorMessage: null,
  addSuccessMessage: null
});

export default function ToastMessageContext({ children }: PropsWithChildren) {
  const messagesRef = useRef<Message[]>([]);
  const [currentMessage, setCurrentMessage] = useState<Message | null>(null);
  const createMessage = useCallback(
    (type: 'success' | 'error', main: string, sub?: string): Message => {
      return {
        createdTimestamp: new Date().getTime(),
        type,
        main,
        sub,
      };
    },
    [],
  );
  const removeCurrentMessage = useCallback(async () => {
    const messages = messagesRef.current;
    await setCurrentMessage(null);
    await new Promise<void>(res => setTimeout(() => res(), 500));
    if (messages.length <= 0) {
      return;
    }
    const newMessage = messages.shift();
    if (!newMessage) {
      return;
    }
    setCurrentMessage(newMessage);
  }, []);

  const addMessageToQueue = useCallback(
    (message: Message) => {
      if (currentMessage === null) {
        setCurrentMessage(message);
      } else {
        messagesRef.current = [...messagesRef.current, ...[message]];
      }
    },
    [currentMessage],
  );

  const addSuccessMessage = useCallback(
    (mainText: string, subText?: string) => {
      addMessageToQueue(createMessage('success', mainText, subText))
    },
    [addMessageToQueue, removeCurrentMessage, currentMessage?.type]
  )

  const addErrorMessage = useCallback(
    (mainText: string, subText?: string) => {
      addMessageToQueue(createMessage('error', mainText, subText));
    },
    [addMessageToQueue, removeCurrentMessage, currentMessage?.type],
  );
  return (
    <>
      <ToastMessageContextWrapper.Provider
        value={{
          addMessageToQueue,
          addErrorMessage,
          addSuccessMessage
        }}
      >
        <AnimatePresence mode="wait">
          {currentMessage && (
            <MessageComponent message={currentMessage} removeMessage={removeCurrentMessage} />
          )}
        </AnimatePresence>
        {children}
      </ToastMessageContextWrapper.Provider>
    </>
  );
}
