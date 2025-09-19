import { ReactNode } from 'react';

type OverlayProps = {
  onClose: () => void;
  children: ReactNode;
};

export const Overlay = ({ onClose, children }: OverlayProps) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 bg-white border border-amber-400 rounded-xl p-5 shadow-xl max-w-md w-[90%]">
        <button
          aria-label="Close"
          onClick={onClose}
          className="absolute -right-2 -top-2 bg-white border border-amber-400 rounded-full w-8 h-8 text-gray-700"
          style={{ fontFamily: 'Comic Sans MS, Comic Sans, Chalkboard SE, cursive' }}
        >
          ×
        </button>
        {children}
      </div>
    </div>
  );
};


