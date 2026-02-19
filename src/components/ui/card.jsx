import React from "react";

export const Card = React.forwardRef(({ className = "", ...props }, ref) => (
  <div
    ref={ref}
    className={`rounded-lg border border-gray-200 bg-white text-gray-900 shadow-sm transition-all hover:shadow-md ${className}`}
    {...props}
  />
));

export const CardHeader = React.forwardRef(({ className = "", ...props }, ref) => (
  <div
    ref={ref}
    className={`flex flex-col space-y-1.5 p-6 ${className}`}
    {...props}
  />
));

export const CardTitle = React.forwardRef(({ className = "", ...props }, ref) => (
  <h3
    ref={ref}
    className={`text-xl font-semibold leading-none tracking-tight ${className}`}
    {...props}
  />
));

export const CardDescription = React.forwardRef(({ className = "", ...props }, ref) => (
  <p
    ref={ref}
    className={`text-sm text-gray-600 ${className}`}
    {...props}
  />
));

export const CardContent = React.forwardRef(({ className = "", ...props }, ref) => (
  <div ref={ref} className={`p-6 pt-0 ${className}`} {...props} />
));

export const CardFooter = React.forwardRef(({ className = "", ...props }, ref) => (
  <div ref={ref} className={`flex items-center p-6 pt-0 ${className}`} {...props} />
));
