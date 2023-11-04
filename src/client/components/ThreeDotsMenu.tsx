import { useState } from "react";

import useOutsideClick from "@/client/hooks/useOutsideClick";

interface Props {
  options: {
    label: string;
    function: () => void;
  }[];
}

export default function ThreeDotsMenu({ options }: Props) {
  const [seeOptions, setSeeOptions] = useState(false);
  const ref = useOutsideClick(() => setSeeOptions(false));
  return (
    <div ref={ref} className="dot-container">
      <div
        className="group-menu"
        onClick={(e) => {
          e.stopPropagation();
          setSeeOptions(true);
        }}
      >
        <div className="dot" />
        <div className="dot" />
        <div className="dot" />
      </div>
      {seeOptions && (
        <div className="frame">
          {options.map((option, index) => (
            <div
              key={`option-${index}`}
              className="info"
              onClick={() => {
                setSeeOptions(false);
                option.function();
              }}
              tabIndex={index}
            >
              <span>{option.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
