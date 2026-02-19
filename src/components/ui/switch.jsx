import React from "react";

export const Switch = React.forwardRef(({ 
  checked, 
  onCheckedChange, 
  className = "",
  disabled = false,
  ...props 
}, ref) => {
  return (
    <button
      ref={ref}
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      className={`
        relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 
        border-transparent transition-colors duration-200 ease-in-out 
        focus:outline-none focus:ring-2 focus:ring-[#4c0519] focus:ring-offset-2
        ${checked ? 'bg-[#4c0519]' : 'bg-gray-200'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${className}
      `}
      onClick={() => !disabled && onCheckedChange?.(!checked)}
      {...props}
    >
      <span
        className={`
          pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white 
          shadow ring-0 transition duration-200 ease-in-out
          ${checked ? 'translate-x-5' : 'translate-x-0'}
        `}
      />
    </button>
  );
});