import React from "react";

export const Label = React.forwardRef(({ className = "", required, children, ...props }, ref) => (
  <label
    ref={ref}
    className={`text-sm font-medium leading-none text-gray-900 peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${className}`}
    {...props}
  >
    {children}
    {required && <span className="text-red-500 ml-1">*</span>}
  </label>
));