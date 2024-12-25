import { LOG_API } from "./api";

// 自定义日志记录器
function sendLogToServer(level: string, timestamp: string, message: string) {
  // 使用 fetch 发送日志信息
  fetch(LOG_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ level, timestamp, message }),
  }).catch((error) => {
    originalConsoleError(`Failed to send log to server: ${error}`);
  });
}

// function getContextInfo() {
//   const stack = new Error().stack.split('\n');
//   const callerLine = stack[2]; // 第一条是Error对象本身，第二条是getContextInfo的调用，第三条是调用getContextInfo的函数
//   const index = callerLine.indexOf('at ');
//   const clean = callerLine.substring(index+3, callerLine.length);
//   const functionName = clean.substring(0, clean.indexOf('(')).trim();
//   const filePath = clean.substring(clean.indexOf('(')+1, clean.indexOf(':'));
//   const lineNumber = clean.substring(clean.indexOf(':')+1, clean.lastIndexOf(':'));
//   const columnNumber = clean.substring(clean.lastIndexOf(':')+1, clean.lastIndexOf(')'));
  
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

console.log = function (...args) {
  const timestamp = new Date().toLocaleString();
  originalConsoleLog(timestamp, ...args);
  sendLogToServer("log", timestamp, fmt_args(args));
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