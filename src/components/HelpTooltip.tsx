import React, { useState, useRef, useEffect } from 'react';

type Props = {
  content: React.ReactNode;
  className?: string;
  id?: string;
};

export default function HelpTooltip({ content, className = '', id }: Props) {
  const [open, setOpen] = useState(false);
  const timeoutRef = useRef<number | null>(null);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  function show() {
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    setOpen(true);
  }
  function hide() {
    timeoutRef.current = window.setTimeout(() => setOpen(false), 150);
  }

  return (
    <div
      ref={ref}
      className={`help-tooltip inline-block relative ${className}`}
      onMouseEnter={show}
      onMouseLeave={hide}
    >
      <button
        type="button"
        aria-describedby={id}
        aria-expanded={open}
        onClick={() => setOpen(v => !v)}
        className="help-tooltip__button flex items-center justify-center w-5 h-5 rounded-full bg-blue-50 text-blue-600 text-xs leading-none border border-blue-100"
      >
        ?
      </button>

      {open && (
        <div
          role="tooltip"
          id={id}
          className="help-tooltip__panel absolute z-50 bottom-full mb-2 w-64 max-w-xs bg-white text-sm text-gray-900 shadow-lg rounded-md p-3 border border-gray-100"
        >
          <div className="text-xs text-gray-600">{content}</div>
        </div>
      )}

      <style jsx>{`
        .help-tooltip__button:focus { outline: none; box-shadow: 0 0 0 3px rgba(59,130,246,0.15); }
        @media (prefers-reduced-motion: no-preference) {
          .help-tooltip__panel { transition: opacity 120ms ease, transform 120ms ease; }
        }
      `}</style>
    </div>
  );
}
