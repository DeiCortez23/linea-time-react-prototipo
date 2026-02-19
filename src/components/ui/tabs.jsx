import React, { createContext, useContext, useState } from "react";

const TabsContext = createContext(undefined);

export const Tabs = React.forwardRef(({ value, onValueChange, children, ...props }, ref) => {
  const [internalValue, setInternalValue] = useState(value);
  
  const currentValue = value !== undefined ? value : internalValue;
  
  const setValue = (newValue) => {
    if (value === undefined) {
      setInternalValue(newValue);
    }
    onValueChange?.(newValue);
  };

  return (
    <TabsContext.Provider value={{ value: currentValue, onValueChange: setValue }}>
      <div ref={ref} {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  );
});

export const TabsList = React.forwardRef(({ className = "", ...props }, ref) => (
  <div
    ref={ref}
    className={`inline-flex h-10 items-center justify-center rounded-md bg-gray-100 p-1 text-gray-500 ${className}`}
    {...props}
  />
));

export const TabsTrigger = React.forwardRef(({ value, children, className = "", ...props }, ref) => {
  const { value: currentValue, onValueChange } = useContext(TabsContext);
  const isActive = currentValue === value;

  return (
    <button
      ref={ref}
      className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${
        isActive 
          ? 'bg-white text-[#4c0519] shadow-sm' 
          : 'text-gray-600 hover:text-gray-900'
      } ${className}`}
      onClick={() => onValueChange(value)}
      {...props}
    >
      {children}
    </button>
  );
});

export const TabsContent = React.forwardRef(({ value, children, className = "", ...props }, ref) => {
  const { value: currentValue } = useContext(TabsContext);
  
  if (currentValue !== value) return null;

  return (
    <div
      ref={ref}
      className={`mt-2 ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
});