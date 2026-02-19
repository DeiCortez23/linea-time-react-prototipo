import React from "react";

export const Textarea = React.forwardRef(({ className = "", error, ...props }, ref) => {
  return (
    <textarea
      className={`
        flex min-h-[80px] w-full rounded-md border bg-white px-3 py-2 text-sm 
        placeholder:text-gray-500 transition-colors resize-none
        focus:outline-none focus:ring-2 focus:ring-[#4c0519] focus:ring-offset-2 
        disabled:cursor-not-allowed disabled:opacity-50
        ${error 
          ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
          : 'border-gray-300 focus:border-[#4c0519]'
        }
        ${className}
      `}
      ref={ref}
      {...props}
    />
  );
});