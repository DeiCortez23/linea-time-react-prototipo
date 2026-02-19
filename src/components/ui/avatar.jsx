import React from "react";

export const Avatar = React.forwardRef(({ className = "", size = "default", ...props }, ref) => {
  const sizes = {
    sm: "h-8 w-8",
    default: "h-10 w-10", 
    lg: "h-12 w-12",
    xl: "h-16 w-16"
  };

  return (
    <div
      ref={ref}
      className={`relative flex shrink-0 overflow-hidden rounded-full border-2 border-white shadow-lg ${sizes[size]} ${className}`}
      {...props}
    />
  );
});

export const AvatarImage = React.forwardRef(({ className = "", src, ...props }, ref) => {
  if (!src) {
    return null;
  }
  return (
    <img
      ref={ref}
      className={`aspect-square h-full w-full object-cover ${className}`}
      src={src}
      {...props}
    />
  );
});

export const AvatarFallback = React.forwardRef(({ className = "", size = "default", children, ...props }, ref) => {
  const textSizes = {
    sm: "text-xs",
    default: "text-sm",
    lg: "text-base",
    xl: "text-lg"
  };

  return (
    <div
      ref={ref}
      className={`flex h-full w-full items-center justify-center rounded-full text-white font-semibold ${textSizes[size]} ${className}`}
      style={{
        background: 'linear-gradient(135deg, #4c0519 0%, #7d1128 50%, #a01c3a 100%)'
      }}
      {...props}
    >
      {children}
    </div>
  );
});