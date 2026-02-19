import React from "react";

export const Badge = React.forwardRef(({ 
  className = "", 
  variant = "default", 
  size = "default",
  ...props 
}, ref) => {
  const variants = {
    default: "bg-gray-100 text-gray-900 border-gray-200",
    secondary: "bg-gray-500 text-white border-gray-600",
    destructive: "bg-red-500 text-white border-red-600",
    outline: "text-gray-900 border-gray-300",
    success: "bg-green-100 text-green-800 border-green-200",
    warning: "bg-yellow-100 text-yellow-800 border-yellow-200",
    info: "bg-blue-100 text-blue-800 border-blue-200"
  };

  const sizes = {
    sm: "px-2 py-0.5 text-xs",
    default: "px-2.5 py-1 text-xs",
    lg: "px-3 py-1.5 text-sm"
  };

  return (
    <div
      ref={ref}
      className={`inline-flex items-center rounded-full border font-medium transition-colors ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    />
  );
});