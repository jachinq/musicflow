import React, { useState, useEffect, useRef } from "react";
import ReactDOM from "react-dom/client";

// 创建确认对话框组件
const ConfirmDialog: React.FC<{
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  onClose: () => void;
}> = ({ message, onConfirm, onCancel, onClose }) => {
  return (
    <div className="confirm-overlay fixed top-0 left-0 w-full h-full flex justify-center items-center bg-black bg-opacity-50">
      <div className="confirm-dialog px-8 py-4 bg-muted rounded-lg flex flex-col items-center gap-4">
        <div className="text-lg font-bold">{message}</div>
        <div className="flex gap-4">
          <button
            className="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            确认
          </button>
          <button
            className="button-info"
            onClick={() => {
              onCancel();
              onClose();
            }}
          >
            取消
          </button>
        </div>
      </div>
    </div>
  );
};

// 创建一个自定义的confirm函数
export const useConfirm = () => {
  const [confirmState, setConfirmState] = useState<{
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
    isOpen: boolean;
  }>({
    message: "",
    onConfirm: () => {},
    onCancel: () => {},
    isOpen: false,
  });

  const confirmRef = useRef<HTMLDivElement | null>(null);
  const rootRef = useRef<ReactDOM.Root | null>(null);

  const openConfirm = (
    message: string,
    onConfirm: () => void,
    onCancel: () => void
  ) => {
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
            onConfirm={confirmState.onConfirm}
            onCancel={confirmState.onCancel}
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
