import ModalWrapper from "@/client/internals/modal/ModalWrapper";
import { BaseModalProps } from "@/client/types";

interface Props extends BaseModalProps {
  title: string;
  message: string;
  subContent?: React.ReactElement;
}

function PreInterruptingMessageModal({ title, message, subContent }: Props) {
  return (
    <div className="interrupting-message">
      <div className="main-content">
        <h1>{title}</h1>
        <div className="message-content">{message}</div>
      </div>
      <div className="sub-content">{subContent}</div>
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
