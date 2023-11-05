import ModalWrapper from "@/client/internals/modal/ModalWrapper";
import { BaseModalProps } from "@/client/types";

interface Props extends BaseModalProps {
  title: string;
  message: string;
}

function PreGameToBeDeletedModal({ title, message }: Props) {
  return (
    <div className="game-to-be-deleted">
      <h1>{title}</h1>
      <div className="message-content">{message}</div>
    </div>
  );
}

const GameToBeDeletedModalWrapped = ModalWrapper(PreGameToBeDeletedModal);

export default function GameToBeDeletedModal(props: Props) {
  return (
    <GameToBeDeletedModalWrapped
      {...props}
      modalInnerExtraClass="game-to-be-deleted-wrapper"
    />
  );
}
