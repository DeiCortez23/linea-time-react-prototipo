import React from "react";
import { X } from "lucide-react";

const AlertDialogContext = React.createContext(undefined);

export const AlertDialog = ({ children, open, onOpenChange }) => {
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
    <AlertDialogContext.Provider value={{ isOpen, onOpenChange: handleOpenChange }}>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity" 
          onClick={() => handleOpenChange(false)}
        />
        <div className="relative z-50 w-full max-w-lg mx-4">
          {children}
        </div>
      </div>
    </AlertDialogContext.Provider>
  );
};

export const AlertDialogContent = React.forwardRef(({ className = "", children, ...props }, ref) => (
  <div
    ref={ref}
    className={`bg-white rounded-lg shadow-lg border border-gray-200 p-6 animate-in fade-in-90 zoom-in-95 ${className}`}
    {...props}
  >
    {children}
  </div>
));

export const AlertDialogHeader = ({ className = "", ...props }) => (
  <div className={`flex flex-col space-y-2 text-center sm:text-left ${className}`} {...props} />
);

export const AlertDialogFooter = ({ className = "", ...props }) => (
  <div className={`flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-3 mt-6 ${className}`} {...props} />
);

export const AlertDialogTitle = React.forwardRef(({ className = "", ...props }, ref) => (
  <h2 
    ref={ref} 
    className={`text-lg font-semibold text-gray-900 ${className}`} 
    {...props} 
  />
));

export const AlertDialogDescription = React.forwardRef(({ className = "", ...props }, ref) => (
  <p 
    ref={ref} 
    className={`text-sm text-gray-600 mt-2 ${className}`} 
    {...props} 
  />
));

export const AlertDialogAction = React.forwardRef(({ className = "", ...props }, ref) => (
  <button
    ref={ref}
    className={`inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ${className}`}
    {...props}
  />
));

export const AlertDialogCancel = React.forwardRef(({ className = "", ...props }, ref) => {
  const { onOpenChange } = React.useContext(AlertDialogContext);
  
  return (
    <button
      ref={ref}
      className={`mt-2 sm:mt-0 inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-900 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ${className}`}
      onClick={() => onOpenChange?.(false)}
      {...props}
    />
  );
});

export const AlertDialogTrigger = React.forwardRef(({ asChild = false, children, ...props }, ref) => {
  if (asChild) {
    return React.cloneElement(children, { ref, ...props });
  }
  return <button ref={ref} {...props}>{children}</button>;
});