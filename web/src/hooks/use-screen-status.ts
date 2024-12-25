import { useEffect, useState } from "react";

const useScreenStatus = () => {
  const [isScreenHidden, setIsScreenHidden] = useState(false);

  // 定义事件处理函数
  const handleVisibilityChange = () => {
    console.log("hidden", document.hidden);
    if (document.hidden) {
        setIsScreenHidden(true);
    } else {
      setIsScreenHidden(false);
    }
  };

  useEffect(() => {
    // 添加事件监听器
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // 清理函数，防止内存泄漏
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    if (isScreenHidden) {
      console.log("页面不可见，可能设备进入睡眠或屏幕熄灭");
    } else {
      console.log("页面可见");
    }
  }, [isScreenHidden]);

  return { isScreenHidden, setIsScreenHidden };
};

export default useScreenStatus;
