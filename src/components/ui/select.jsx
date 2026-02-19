import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";

const SelectContext = React.createContext(undefined);

export const Select = React.forwardRef(({ value, onValueChange, children, ...props }, ref) => {
  const [open, setOpen] = useState(false);
  const selectRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleValueChange = (newValue) => {
    onValueChange?.(newValue);
    setOpen(false);
  };

  return (
    <SelectContext.Provider value={{ value, onValueChange: handleValueChange, open, setOpen }}>
      <div ref={selectRef} className="relative w-full" {...props}>
        {children}
      </div>
    </SelectContext.Provider>
  );
});

export const SelectTrigger = React.forwardRef(({ className = "", children, ...props }, ref) => {
  const { setOpen, open, value } = React.useContext(SelectContext);

  return (
    <button
      ref={ref}
      className={`
        flex h-10 w-full items-center justify-between rounded-md border border-gray-300 
        bg-white px-3 py-2 text-sm transition-colors
        hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4c0519] focus:ring-offset-2
        disabled:cursor-not-allowed disabled:opacity-50
        ${className}
      `}
      onClick={() => setOpen(!open)}
      type="button"
      {...props}
    >
      <span className="flex-1 text-left text-gray-900 truncate">{children}</span>
      <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
    </button>
  );
});

export const SelectValue = React.forwardRef(({ placeholder = "Seleccionar...", ...props }, ref) => {
  const { value } = React.useContext(SelectContext);
  
  return (
    <span ref={ref} className="text-gray-900 truncate" {...props}>
      {value || placeholder}
    </span>
  );
});

export const SelectContent = React.forwardRef(({ className = "", children, ...props }, ref) => {
  const { open, setOpen } = React.useContext(SelectContext);

  if (!open) return null;

  return (
    <div
      ref={ref}
      className={`
        absolute z-50 w-full min-w-[8rem] overflow-hidden rounded-md border border-gray-200 
        bg-white p-1 shadow-lg animate-in fade-in-80
        ${className}
      `}
      style={{ top: '100%', left: 0, marginTop: '4px' }}
      {...props}
    >
      <div className="max-h-60 overflow-auto">
        {children}
      </div>
    </div>
  );
});

export const SelectItem = React.forwardRef(({ value, children, ...props }, ref) => {
  const { onValueChange, setOpen, value: selectedValue } = React.useContext(SelectContext);

  const handleSelect = () => {
    onValueChange?.(value);
    setOpen(false);
  };

  const isSelected = selectedValue === value;

  return (
    <div
      ref={ref}
      className={`
        relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 
        text-sm outline-none transition-colors
        hover:bg-gray-100 focus:bg-gray-100
        ${isSelected ? 'bg-gray-100 text-gray-900 font-medium' : 'text-gray-900'}
      `}
      onClick={handleSelect}
      {...props}
    >
      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        {isSelected && <Check className="h-4 w-4 text-[#4c0519]" />}
      </span>
      <span className="flex-1 truncate">{children}</span>
    </div>
  );
});