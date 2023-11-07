import ModalWrapper from "@/client/internals/modal/ModalWrapper";
import { BaseModalProps } from "@/client/types";

interface Props extends BaseModalProps {
  title: string;
  message: string;
}

function PreInterruptingMessageModal({ title, message }: Props) {
  return (
    <div className="interrupting-message">
      <h1>{title}</h1>
      <div className="message-content">{message}</div>
    </div>
  );
}

const InterruptingMessageModalWrapped = ModalWrapper(
  PreInterruptingMessageModal
);

export default function InterruptingMessageModal(props: Props) {
  return (
    <InterruptingMessageModalWrapped
      {...props}
      modalInnerExtraClass="interrupting-message-wrapper"
    />
  );
}
