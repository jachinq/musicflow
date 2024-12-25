import { Moon, Settings, Sun } from "lucide-react"
import { useTheme } from "./theme-provider"



export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <div className="flex items-center space-x-2">
      <Theme isActived={theme === "dark"}>
        <Moon className=" h-[1.2rem] w-[1.2rem] rotate-90 transition-all dark:rotate-0" onClick={() => setTheme("dark")} />
      </Theme>
      <Theme isActived={theme === "light"}>
        <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 transition-all dark:-rotate-90" onClick={() => setTheme("light")} />
      </Theme>
      <Theme isActived={theme === "system"}>
        <Settings className="h-[1.2rem] w-[1.2rem] rotate-0 transition-all dark:-rotate-90" onClick={() => setTheme("system")} />
      </Theme>
    </div>
  )
}

const Theme = ({ isActived, ...props }: { isActived: boolean } & React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div className={`${isActived && "text-blue-500"} cursor-pointer`} {...props}></div>
  )
}