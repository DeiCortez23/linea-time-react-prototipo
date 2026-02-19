import React from "react";

export const Progress = React.forwardRef(({ 
  value = 0, 
  className = "", 
  showValue = false,
  ...props 
}, ref) => {
  const percentage = Math.min(Math.max(value, 0), 100);
  
  return (
    <div className={`w-full ${className}`}>
      <div
        ref={ref}
        className="relative h-2 w-full overflow-hidden rounded-full bg-gray-200"
        {...props}
      >
        <div
          className="h-full w-full flex-1 bg-[#4c0519] transition-all duration-500 ease-out"
          style={{ 
            width: `${percentage}%`,
            background: 'linear-gradient(90deg, #4c0519 0%, #7d1128 50%, #a01c3a 100%)'
          }}
        />
      </div>
      {showValue && (
        <div className="flex justify-between items-center mt-1">
          <span className="text-xs text-gray-600">Progreso</span>
          <span className="text-xs font-medium text-[#4c0519]">{percentage}%</span>
        </div>
      )}
    </div>
  );
});