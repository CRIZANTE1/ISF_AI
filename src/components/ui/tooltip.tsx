"use client";

import * as React from "react";
import { cn } from "../../utils/cn";

interface TooltipContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const TooltipContext = React.createContext<TooltipContextValue>({
  open: false,
  setOpen: () => {},
});

const TooltipProvider: React.FC<{ children: React.ReactNode; delayDuration?: number }> = ({ 
  children, 
  delayDuration = 0 
}) => {
  const [open, setOpen] = React.useState(false);
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout>>();

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (delayDuration > 0) {
      timeoutRef.current = setTimeout(() => setOpen(true), delayDuration);
    } else {
      setOpen(true);
    }
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setOpen(false);
  };

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <TooltipContext.Provider value={{ open, setOpen }}>
      <div onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} className="relative">
        {children}
      </div>
    </TooltipContext.Provider>
  );
};

const Tooltip: React.FC<{ children: React.ReactNode; delayDuration?: number }> = ({ 
  children, 
  delayDuration 
}) => {
  return <TooltipProvider delayDuration={delayDuration}>{children}</TooltipProvider>;
};

const TooltipTrigger: React.FC<{ 
  asChild?: boolean; 
  children: React.ReactNode;
  className?: string;
}> = ({ asChild, children, className }) => {
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, { className: cn(className, children.props.className) });
  }
  return <span className={className}>{children}</span>;
};

const TooltipContent: React.FC<{ 
  children: React.ReactNode;
  className?: string;
  sideOffset?: number;
}> = ({ children, className, sideOffset = 4 }) => {
  const { open } = React.useContext(TooltipContext);
  
  if (!open) return null;

  return (
    <div
      className={cn(
        "absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 overflow-hidden rounded-md border border-white/20 bg-black/95 px-3 py-1.5 text-sm text-white shadow-lg whitespace-nowrap",
        className
      )}
      style={{ marginBottom: sideOffset }}
    >
      {children}
    </div>
  );
};

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };

