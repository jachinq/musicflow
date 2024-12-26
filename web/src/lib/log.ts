

// function getContextInfo() {
//   const stack = new Error().stack.split('\n');
//   const callerLine = stack[2]; // 第一条是Error对象本身，第二条是getContextInfo的调用，第三条是调用getContextInfo的函数
//   const index = callerLine.indexOf('at ');
//   const clean = callerLine.substring(index+3, callerLine.length);
//   const functionName = clean.substring(0, clean.indexOf('(')).trim();
//   const filePath = clean.substring(clean.indexOf('(')+1, clean.indexOf(':'));
//   const lineNumber = clean.substring(clean.indexOf(':')+1, clean.lastIndexOf(':'));
//   const columnNumber = clean.substring(clean.lastIndexOf(':')+1, clean.lastIndexOf(')'));

import { sendLogToServer } from "./api";

  
//   return {
//       functionName,
//       filePath,
//       lineNumber,
//       columnNumber
//   };
// }


const fmt_args = (args: any[]) => {
  let args_fmt: string[] = [];
  args.forEach((arg) => {
    if (typeof arg === "object") {
      try {
        const json = JSON.stringify(arg);
        args_fmt.push(json);
      } catch (error) {
        args_fmt.push(arg);
      }
    } else {
      args_fmt.push(arg);
    }
  });
  return args_fmt.join(" ");
}

// 拦截控制台输出
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;
const originalConsoleInfo = console.info;

console.log = function (...args) {
  const timestamp = new Date().toLocaleString();
  originalConsoleLog(timestamp, ...args);
  sendLogToServer("log", timestamp, fmt_args(args));
};

console.info = function (...args) {
  const timestamp = new Date().toLocaleString();
  originalConsoleInfo(timestamp, ...args);
  sendLogToServer("info", timestamp, fmt_args(args));
};

console.error = function (...args) {
  const timestamp = new Date().toLocaleString();
  originalConsoleError(timestamp, ...args);
  sendLogToServer("error", timestamp, fmt_args(args));
};

console.warn = function (...args) {
  const timestamp = new Date().toLocaleString();
  originalConsoleWarn(timestamp, ...args);
  sendLogToServer("warn", timestamp, fmt_args(args));
};