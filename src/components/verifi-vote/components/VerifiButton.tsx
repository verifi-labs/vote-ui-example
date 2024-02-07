import { FC, MouseEvent, PropsWithChildren } from "react";

interface VerifiButtonProps {
  primary?: boolean;
  loading?: boolean;
  type?: "button" | "submit" | "reset" | undefined;
  disabled?: boolean;
  className?: string;
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
}

const VerifiButton: FC<PropsWithChildren<VerifiButtonProps>> = ({ primary = false, loading = false, type = 'button', disabled = false, className, children, onClick }) => {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`rounded-2xl leading-[100%] disabled:opacity-50 border button hover:rounded-none transition-all px-[20px] h-[46px] outline-0  ${primary ? 'primary' : ''} ${className}`}
      onClick={onClick}
    >
      {loading ? (
        // Replace with your loading component
        <div>Loading...</div>
      ) : (
        children
      )}
    </button>
  );
};

export default VerifiButton;