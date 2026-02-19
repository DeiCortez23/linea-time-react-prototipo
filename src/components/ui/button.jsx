import React from "react";

export const Button = React.forwardRef(({ 
  className = "", 
  variant = "default", 
  size = "default", 
  disabled = false,
  loading = false,
  children,
  ...props 
}, ref) => {
  const baseStyles = "inline-flex items-center justify-center rounded-md font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";
  
  const variants = {
    default: "bg-gray-900 text-white hover:bg-gray-800 active:bg-gray-700 shadow-sm",
    destructive: "bg-red-600 text-white hover:bg-red-700 active:bg-red-800 shadow-sm",
    outline: "border border-gray-300 bg-white text-gray-900 hover:bg-gray-50 active:bg-gray-100",
    secondary: "bg-gray-100 text-gray-900 hover:bg-gray-200 active:bg-gray-300",
    ghost: "text-gray-900 hover:bg-gray-100 active:bg-gray-200",
    link: "text-gray-900 underline hover:no-underline hover:text-gray-700"
  };

  const sizes = {
    default: "h-10 px-4 py-2 text-sm",
    sm: "h-9 px-3 text-sm",
    lg: "h-11 px-8 text-base",
    icon: "h-10 w-10"
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      ref={ref}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      )}
      {children}
    </button>
  );
});