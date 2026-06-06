import { ButtonHTMLAttributes } from "react";
import "@/components/unlock-pro-button.css";

interface UnlockProButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  text?: string;
}

const UnlockProButton = ({ text = "Unlock Pro", className = "", ...rest }: UnlockProButtonProps) => {
  const letters = text.split("");
  return (
    <div className={`btn-wrapper ${className}`}>
      <button {...rest} className="btn">
        <svg className="btn-svg" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path d="M50 5 L60 40 L95 50 L60 60 L50 95 L40 60 L5 50 L40 40 Z" />
        </svg>
        <div className="txt-wrapper">
          <div className="txt-1">
            {letters.map((ch, i) => (
              <span key={i} className="btn-letter">{ch === " " ? "\u00A0" : ch}</span>
            ))}
          </div>
        </div>
      </button>
    </div>
  );
};

export default UnlockProButton;
