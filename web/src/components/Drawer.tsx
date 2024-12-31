import { X } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";

interface DrawerProps {
  title?: string;
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export const Drawer: React.FC<DrawerProps> = ({
  title = "Drawer",
  isOpen,
  onClose,
  children,
}) => {
  const drawerRef = useRef(null);
  if (!isOpen) {
    return null;
  }
  useEffect(() => {
    if (!drawerRef.current) return;
    if (isOpen) {
      // drawerRef.current.classList.add("translate-x-0");
    } else {
      // drawerRef.current.classList.add("translate-x-full");
    }
  }, [isOpen]);
  return (
    <div
      className={`fixed inset-0 flex z-50 ${
        isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
    >
      <div className="flex-1 bg-gray-800 opacity-0" onClick={onClose}></div>
      <div
        ref={drawerRef}
        className={`bg-primary flex flex-col w-1/2 max-w-sm transition-transform duration-300 ease-in-out transform delay-[1s] translate-x-full"
        `}
      >
        <div className="flex justify-between items-center p-4 select-none">
          <div>{title}</div>
          <X
            className="cursor-pointer hover:text-primary-hover"
            onClick={onClose}
          />
        </div>
        <div style={{ overscrollBehavior: "contain" }}>{children}</div>
      </div>
    </div>
  );
};
