import { createContext, useContext } from "react";
import { useDevice } from "../hooks/use-device";

const context = createContext({} as any);

export const Option = ({
  value,
  className = "",
  icon,
  children,
  ...props
}: {
  value: any;
  icon?: React.ReactNode;
} & React.HTMLAttributes<HTMLDivElement>) => {
  const { isSmallDevice } = useDevice();
  const { defaultValue, setValue } = useContext(context);
  return (
    <div
      className={`cursor-pointer ${className || ""} ${
        value === defaultValue && "text-blue-500"
      } ${!isSmallDevice ? "hover:text-primary-hover" : ""} ${
        icon ? "flex items-center gap-2" : ""
      }`}
      {...props}
      onClick={() => setValue && setValue(value)}
    >
      {icon}
      {children}
    </div>
  );
};

export const OptionGroup = ({
  setValue,
  defaultValue,
  children,
  className = "",
  between = false,
  drirection = "row",
}: {
  setValue: any;
  defaultValue: any;
  className?: string;
  children: React.ReactNode;
  between?: boolean;
  drirection?: "row" | "column";
}) => {
  const { isSmallDevice } = useDevice();
  return (
    <context.Provider value={{ defaultValue, setValue }}>
      <div
        className={`flex items-center gap-2 w-full select-none ${
          isSmallDevice
            ? between
              ? "justify-between"
              : "justify-evenly"
            : "gap-8"
        } ${className} ${drirection === "column" ? "flex-col" : ""}`}
      >
        {children}
      </div>
    </context.Provider>
  );
};
