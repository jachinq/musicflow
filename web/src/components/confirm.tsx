import React, { useState, useEffect, useRef } from "react";
import ReactDOM from "react-dom/client";

// 创建确认对话框组件
const ConfirmDialog: React.FC<{
  message: React.ReactNode;
  onConfirm: (e: React.MouseEvent) => void;
  onCancel: (e: React.MouseEvent) => void;
  onClose: (e: React.MouseEvent) => void;
}> = ({ message, onConfirm, onCancel, onClose }) => {
  return (
    <div className="confirm-overlay fixed top-0 left-0 w-full h-full flex justify-center items-center bg-black bg-opacity-50 z-[999]">
      <div className="confirm-dialog px-8 py-4 bg-muted rounded-lg flex flex-col items-center gap-4">
        <div className="text-lg font-bold">{message}</div>
        <div className="flex gap-4">
          <button
            className="button"
            onClick={(e) => {
              onConfirm(e);
              onClose(e);
            }}
          >
            确认
          </button>
          <button
            className="button-info"
            onClick={(e) => {
              onCancel(e);
              onClose(e);
            }}
          >
            取消
          </button>
        </div>
      </div>
    </div>
  );
};

interface ConfirmOptions {
  message?: React.ReactNode;
  onConfirm?: (e: React.MouseEvent) => void;
  onCancel?: (e: React.MouseEvent) => void;
}

interface ConfirmStateProps {
  message: React.ReactNode;
  onConfirm: (e: React.MouseEvent) => void;
  onCancel: (e: React.MouseEvent) => void;
  isOpen: boolean;
}

// 创建一个自定义的confirm函数
export const useConfirm = () => {
  const [confirmState, setConfirmState] = useState<ConfirmStateProps>({
    message: "",
    onConfirm: () => { },
    onCancel: () => { },
    isOpen: false,
  });

  const confirmRef = useRef<HTMLDivElement | null>(null);
  const rootRef = useRef<ReactDOM.Root | null>(null);

  const openConfirm = ({ message = "message", onConfirm = () => { }, onCancel = () => { } }: ConfirmOptions) => {
    setConfirmState({ message, onConfirm, onCancel, isOpen: true });
  };

  const closeConfirm = () => {
    setConfirmState({ ...confirmState, isOpen: false });
  };

  useEffect(() => {
    if (confirmState.isOpen) {
      if (!confirmRef.current) {
        confirmRef.current = document.createElement("div");
        document.body.appendChild(confirmRef.current);
      }

      if (!rootRef.current && confirmRef.current) {
        rootRef.current = ReactDOM.createRoot(confirmRef.current);
      }

      if (rootRef.current) {
        rootRef.current.render(
          <ConfirmDialog
            message={confirmState.message}
            onConfirm={(e: React.MouseEvent<Element, MouseEvent>) => confirmState.onConfirm(e)}
            onCancel={(e: React.MouseEvent<Element, MouseEvent>) => confirmState.onCancel(e)}
            onClose={closeConfirm}
          />
        );
      }
    } else {
      if (confirmRef.current && rootRef.current) {
        // 使用setTimeout来延迟卸载操作
        setTimeout(() => {
          rootRef.current?.unmount();
          confirmRef.current?.remove();
          //   document.body.removeChild(confirmRef.current);
          confirmRef.current = null;
          rootRef.current = null;
        }, 0);
      }
    }
  }, [confirmState]);

  return openConfirm;
};
