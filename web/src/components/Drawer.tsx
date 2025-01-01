import { X } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { useDevice } from "../hooks/use-device";

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
  const [showDrawer, setShowDrawer] = useState(false); // 控制动画
  const maskRef = useRef(null);
  const { isSmallDevice } = useDevice();

  useEffect(() => {
    // 当打开的时候，isopen=true，showDrawer from false to true, className from "translate-x-full" to "translate-x-0"
    setTimeout(() => setShowDrawer(isOpen), 0);
  }, [isOpen]);

  const delayClose = () => {
    // 点击关闭的时候，延迟300ms，让动画结束后再真正调用onClose卸载组件
    setShowDrawer(false);
    setTimeout(() => onClose(), 300);
  };

  if (!isOpen) {
    return null;
  }

  const adaptiveClass = () => {
    let className = "w-1/2 h-[100vh]";
    let translate = showDrawer ? "translate-x-0" : "translate-x-full";
    if (isSmallDevice) {
      className = "w-full h-full";
      translate = showDrawer ? "translate-y-0" : "translate-y-full";
    }
    // console.log(className, translate);
    return `${className} ${translate}`
  }

  return <>
    <div ref={maskRef} className="mask" style={{opacity: showDrawer ? 0.5 : 0}}></div>
    <div
      className={`fixed inset-0 flex z-50 overflow-y-scroll overflow-x-hidden  ${isSmallDevice ? "flex-col" : "flex-row"}`}
    >
      <div className="flex-1 bg-gray-800 opacity-0" onClick={delayClose}></div>
      <div
        className={`bg-secondary flex flex-col shadow-lg transform transition-transform duration-300 ease-in-out  ${adaptiveClass()}
        `}
      >
        <div className="flex justify-between items-center p-4 select-none text-md font-bold">
          <div>{title}</div>
          <X
            className="cursor-pointer hover:text-primary-hover"
            onClick={delayClose}
          />
        </div>
        <div className="p-4 bg-secondary">{children}</div>
      </div>
    </div>
  </>
};
