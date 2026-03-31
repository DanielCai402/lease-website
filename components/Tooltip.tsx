'use client';
import { useState } from 'react';
import ReactDOM from 'react-dom';

export default function Tooltip({ text }: { text: string }) {
  const [visible, setVisible] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });

  const handleMouseEnter = (e: React.MouseEvent) => {
    setPos({ x: e.clientX, y: e.clientY });
    setVisible(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    setPos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseLeave = () => setVisible(false);

  return (
    <>
      <span
        onMouseEnter={handleMouseEnter}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-gray-200 text-gray-500 text-xs cursor-help select-none"
      >
        ?
      </span>
      {visible && typeof window !== 'undefined' && ReactDOM.createPortal(
        <div
          style={{ top: pos.y - 40, left: pos.x + 10, position: 'fixed', zIndex: 99999 }}
          className="bg-gray-800 text-white text-xs rounded px-2 py-1 max-w-[200px] pointer-events-none whitespace-normal"
        >
          {text}
        </div>,
        document.body
      )}
    </>
  );
}
