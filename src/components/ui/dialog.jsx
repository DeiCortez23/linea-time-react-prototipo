import React from "react";
import { X } from "lucide-react";

const DialogContext = React.createContext(undefined);

export const Dialog = React.forwardRef(({ open, onOpenChange, children, ...props }, ref) => {
  const [isOpen, setIsOpen] = React.useState(open);

  React.useEffect(() => {
    setIsOpen(open);
  }, [open]);

  const handleOpenChange = (newOpen) => {
    setIsOpen(newOpen);
    onOpenChange?.(newOpen);
  };

  if (!isOpen) return null;

  return (
    <DialogContext.Provider value={{ isOpen, onOpenChange: handleOpenChange }}>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity animate-in fade-in-0" 
          onClick={() => handleOpenChange(false)}
        />
        <div ref={ref} className="relative z-50 max-h-[90vh] overflow-hidden" {...props}>
          {children}
        </div>
      </div>
    </DialogContext.Provider>
  );
});

export const DialogContent = React.forwardRef(({ className = "", children, ...props }, ref) => {
  const { onOpenChange } = React.useContext(DialogContext);

  return (
    <div
      ref={ref}
      className={`fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border border-gray-200 bg-white p-6 shadow-lg duration-200 animate-in fade-in-90 zoom-in-95 sm:rounded-lg ${className}`}
      {...props}
    >
      <button
        onClick={() => onOpenChange?.(false)}
        className="absolute right-4 top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
      >
        <X className="h-4 w-4" />
        <span className="sr-only">Cerrar</span>
      </button>
      {children}
    </div>
  );
});

export const DialogHeader = React.forwardRef(({ className = "", ...props }, ref) => (
  <div
    ref={ref}
    className={`flex flex-col space-y-1.5 text-center sm:text-left ${className}`}
    {...props}
  />
));

export const DialogTitle = React.forwardRef(({ className = "", ...props }, ref) => (
  <h2
    ref={ref}
    className={`text-lg font-semibold leading-none tracking-tight text-gray-900 ${className}`}
    {...props}
  />
));

export const DialogDescription = React.forwardRef(({ className = "", ...props }, ref) => (
  <p
    ref={ref}
    className={`text-sm text-gray-600 ${className}`}
    {...props}
  />
));