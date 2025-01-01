import { X } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useDevice } from "../hooks/use-device";
import { useClickAway } from "@uidotdev/usehooks";

interface DrawerProps {
  title?: string;
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  hasTitle?: boolean;
}

export const Drawer: React.FC<DrawerProps> = ({
  title = "Drawer",
  isOpen,
  onClose,
  children,
  hasTitle = true,
}) => {
  const [showDrawer, setShowDrawer] = useState(false); // 控制动画
  const { isSmallDevice } = useDevice();
  const ref = useClickAway(() => delayClose());

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
    let width = "w-1/2";
    let translate = showDrawer ? "translate-x-0" : "translate-x-full";
    if (isSmallDevice) {
      width = "w-full";
      translate = showDrawer ? "translate-y-0" : "translate-y-full";
    }
    // console.log(className, translate);
    return `h-[100vh] ${width} ${translate}`;
  };

  return (
    <>
      <div className="mask" style={{ opacity: showDrawer ? 0.5 : 0 }}></div>
      <div
        className={`fixed inset-0 flex z-50 overflow-y-scroll overflow-x-hidden  ${
          isSmallDevice ? "flex-col" : "flex-row"
        }`}
      >
        <div className="flex-1"></div>
        <div
          ref={ref as any}
          className={`bg-secondary flex flex-col shadow-lg transform transition-transform duration-300 ease-in-out  ${adaptiveClass()}
        `}
        >
          {hasTitle && (
            <div className="flex justify-between items-center p-4 select-none text-md font-bold">
              <div>{title}</div>
              <X
                className="cursor-pointer hover:text-primary-hover"
                onClick={delayClose}
              />
            </div>
          )}
          <div className="p-4 bg-secondary">{children}</div>
        </div>
      </div>
    </>
  );
};
