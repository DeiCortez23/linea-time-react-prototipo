import React, { createContext, useContext, useState } from "react";

const SidebarContext = createContext(undefined);

export const SidebarProvider = ({ children, defaultOpen = true }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const toggle = () => setIsOpen(!isOpen);

  return (
    <SidebarContext.Provider value={{ isOpen, setIsOpen, toggle }}>
      {children}
    </SidebarContext.Provider>
  );
};

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
};

export const Sidebar = React.forwardRef(({ className = "", ...props }, ref) => {
  const { isOpen } = useSidebar();

  return (
    <div
      ref={ref}
      className={`
        bg-white border-r border-gray-200 transition-all duration-300 overflow-hidden
        ${isOpen ? "w-64" : "w-20"} 
        ${className}
      `}
      {...props}
    />
  );
});

export const SidebarTrigger = React.forwardRef(({ className = "", ...props }, ref) => {
  const { toggle } = useSidebar();

  return (
    <button
      ref={ref}
      className={`
        p-2 hover:bg-gray-100 rounded-md transition-colors focus:outline-none focus:ring-2 
        focus:ring-[#4c0519] focus:ring-offset-2
        ${className}
      `}
      onClick={toggle}
      {...props}
    />
  );
});

export const SidebarHeader = React.forwardRef(({ className = "", ...props }, ref) => (
  <div ref={ref} className={`p-6 border-b border-gray-200 ${className}`} {...props} />
));

export const SidebarContent = React.forwardRef(({ className = "", ...props }, ref) => (
  <div ref={ref} className={`flex-1 overflow-auto ${className}`} {...props} />
));

export const SidebarFooter = React.forwardRef(({ className = "", ...props }, ref) => (
  <div ref={ref} className={`p-4 border-t border-gray-200 ${className}`} {...props} />
));

export const SidebarGroup = React.forwardRef(({ className = "", ...props }, ref) => (
  <div ref={ref} className={`flex w-full flex-col gap-2 p-4 ${className}`} {...props} />
));

export const SidebarGroupLabel = React.forwardRef(({ className = "", ...props }, ref) => (
  <div ref={ref} className={`text-xs font-semibold uppercase tracking-wider text-gray-500 ${className}`} {...props} />
));

export const SidebarGroupContent = React.forwardRef(({ className = "", ...props }, ref) => (
  <div ref={ref} className={`flex w-full flex-col gap-1 ${className}`} {...props} />
));

export const SidebarMenu = React.forwardRef(({ className = "", ...props }, ref) => (
  <div ref={ref} className={`flex w-full flex-col gap-1 ${className}`} {...props} />
));

export const SidebarMenuItem = React.forwardRef(({ className = "", ...props }, ref) => (
  <div ref={ref} className={`flex w-full flex-col gap-1 ${className}`} {...props} />
));

export const SidebarMenuButton = React.forwardRef(({ 
  asChild = false, 
  className = "", 
  active = false,
  ...props 
}, ref) => {
  if (asChild) {
    return React.cloneElement(props.children, { 
      ref, 
      className: `
        ${props.children.props.className || ''} 
        flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors
        ${active 
          ? 'bg-[#4c0519] text-white' 
          : 'text-gray-700 hover:bg-gray-100'
        }
        ${className}
      `.trim()
    });
  }
  return (
    <button
      ref={ref}
      className={`
        flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors
        ${active 
          ? 'bg-[#4c0519] text-white' 
          : 'text-gray-700 hover:bg-gray-100'
        }
        ${className}
      `}
      {...props}
    />
  );
});