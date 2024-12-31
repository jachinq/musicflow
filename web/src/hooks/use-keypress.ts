import { useEffect, useRef } from 'react';

export const useKeyPress = (
  key: string, // 目标键（例如 "ArrowRight"）
  callback: (event: KeyboardEvent) => void,
  options: { ctrlKey?: boolean; shiftKey?: boolean; altKey?: boolean } = {}
) => {
  const { ctrlKey = false, shiftKey = false, altKey = false } = options;

  // 使用 useRef 来存储 callback 函数
  const callbackRef = useRef(callback);

  // 每次 callback 变化时，更新 ref 的值
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // 使用 useRef 来存储 handleKeyPress 函数
  const handleKeyPressRef = useRef((event: KeyboardEvent) => {
    if (
      event.key === key && // 检查按下的键
      event.ctrlKey === ctrlKey && // 检查 Ctrl 键
      event.shiftKey === shiftKey && // 检查 Shift 键
      event.altKey === altKey // 检查 Alt 键
    ) {
      // 按键触发元素不是 body 的话，不执行 callback
      // console.log('useKeyPress prevent default', key, event);
      if (event.target !== document.body) {
        return;
      }
      callbackRef.current(event);
    }
  });

  useEffect(() => {
    // 将 handleKeyPressRef.current 赋值给实际的事件处理函数
    const handleKeyPress = handleKeyPressRef.current;

    // console.log('useKeyPress mounted', key);
    // 绑定事件监听器
    window.addEventListener('keydown', handleKeyPress);
    // 清除事件监听器
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [key, ctrlKey, shiftKey, altKey]); // 在 key 或组合键选项变化时重新绑定事件
};
