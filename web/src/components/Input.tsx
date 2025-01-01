import { useState } from 'react';

// 定义Input组件的Props类型
interface InputProps {
  type?: string; // 可选类型，默认为'text'
  placeholder?: string; // 可选占位符
  value?: string; // 可选值
  onChange?: (value: string, name: string) => void; // 可选的onChange回调函数
  name?: string; // 可选的name属性
  className?: string; // 可选的className
  onEnter?: (value: string, name: string) => void; // 可选的onEnter回调函数
}

// 自定义Input组件
export const Input = ({ type = 'text', placeholder, value, name, className, onChange, onEnter }: InputProps) => {
  // 使用useState来管理输入框的值
  const [inputValue, setInputValue] = useState(value || '');

  // 处理输入变化的函数
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    setInputValue(newValue);
    if (onChange) {
      onChange(newValue, name || '');
    }
  };

  return (
    <input
      type={type}
      placeholder={placeholder}
      value={inputValue}
      onChange={handleInputChange}
      onKeyDown={(event) => {
        if (event.key === 'Enter') {
          onEnter && onEnter(inputValue, name || '');
        }
      }}
      name={name}
      className={`${className || ''} outline-none bg-muted px-4 py-2 rounded-sm w-full`}
    />
  );
};