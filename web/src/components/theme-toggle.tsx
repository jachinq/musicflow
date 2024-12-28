import { Moon, Settings, Sun } from "lucide-react"
import { useTheme } from "./theme-provider"



export function ThemeToggle() {

  return (
    <div className="flex items-center space-x-2">
      <Theme type="dark" >
        <Moon className=" h-[1.2rem] w-[1.2rem] rotate-90 transition-all dark:rotate-0"/>
        <div className="text-xs font-bold">Dark</div>
      </Theme>
      <Theme type="light" >
        <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 transition-all dark:-rotate-90"/>
        <div className="text-xs font-bold">Light</div>
      </Theme>
      <Theme type="system">
        <Settings className="h-[1.2rem] w-[1.2rem] rotate-0 transition-all dark:-rotate-90" />
        <div className="text-xs font-bold">System</div>
      </Theme>
    </div>
  )
}

const Theme = ({ type, ...props }: { type: "dark" | "light" | "system" } & React.HTMLAttributes<HTMLDivElement>) => {
  const { theme, setTheme } = useTheme()

  return (
    <div className={`${theme===type && "text-blue-500"} cursor-pointer hover:text-primary-hover  `} {...props}  onClick={() => setTheme(type)} ></div>
  )
}