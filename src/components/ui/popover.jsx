import React, { useState, useRef, useEffect } from "react";

const PopoverContext = React.createContext(undefined);

export const Popover = React.forwardRef(({ children, open: controlledOpen, onOpenChange, ...props }, ref) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;

  const setOpen = (newOpen) => {
    if (!isControlled) {
      setInternalOpen(newOpen);
    }
    onOpenChange?.(newOpen);
  };

  return (
    <PopoverContext.Provider value={{ open, setOpen }}>
      <div ref={ref} className="relative" {...props}>
        {children}
      </div>
    </PopoverContext.Provider>
  );
});

export const PopoverTrigger = React.forwardRef(({ asChild = false, children, ...props }, ref) => {
  const { setOpen, open } = React.useContext(PopoverContext);

  if (asChild) {
    return React.cloneElement(children, { 
      ref,
      onClick: () => setOpen(!open)
    });
  }

  return (
    <button
      ref={ref}
      onClick={() => setOpen(!open)}
      {...props}
    >
      {children}
    </button>
  );
});

// MEJORA: PopoverContent con mejor manejo de z-index y eventos
export const PopoverContent = React.forwardRef(({ 
  className = "", 
  align = "center", 
  side = "bottom", 
  ...props 
}, ref) => {
  const { open, setOpen } = React.useContext(PopoverContext);
  const contentRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (contentRef.current && !contentRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") setOpen(false);
      });
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open, setOpen]);

  if (!open) return null;

  const alignmentClasses = {
    center: "left-1/2 -translate-x-1/2",
    start: "left-0",
    end: "right-0"
  };

  const sideClasses = {
    bottom: "top-full mt-1",
    top: "bottom-full mb-1",
    left: "right-full mr-1",
    right: "left-full ml-1"
  };

  return (
    <div
      ref={contentRef}
      className={`absolute z-50 w-72 rounded-md border border-gray-200 bg-white p-4 text-gray-950 shadow-md outline-none animate-in fade-in-80 ${alignmentClasses[align]} ${sideClasses[side]} ${className}`}
      {...props}
    />
  );
});