// pages/SettingsPage.tsx
import { Input } from "../components/Input";
import { Option, OptionGroup } from "../components/Option";
import { useTheme } from "../components/theme-provider";
import { useDevice } from "../hooks/use-device";
import { useSettingStore } from "../store/setting";
import {
  ListMusic,
  Moon,
  RefreshCcwDot,
  Settings,
  Shuffle,
  Sun,
} from "lucide-react";

function SettingsPage() {
  const { play_mode, server_url, setPlayMode, setServerUrl } =
    useSettingStore();

  const { theme, setTheme } = useTheme();

  return (
    <div className="p-4 overflow-scroll flex justify-center items-center">
      <div className="max-w-[860px] w-full gap-4 flex flex-col">
        <FormLayout label="主题">
          <OptionGroup defaultValue={theme} setValue={setTheme}>
            <Option
              value="dark"
              icon={
                <Moon className=" h-[1.2rem] w-[1.2rem] rotate-90 transition-all dark:rotate-0" />
              }
            >
              <div className="text-xs font-bold">Dark</div>
            </Option>
            <Option
              value="light"
              icon={
                <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 transition-all dark:-rotate-90" />
              }
            >
              <div className="text-xs font-bold">Light</div>
            </Option>
            <Option
              value="system"
              icon={
                <Settings className="h-[1.2rem] w-[1.2rem] rotate-0 transition-all dark:-rotate-90" />
              }
            >
              <div className="text-xs font-bold">System</div>
            </Option>
          </OptionGroup>
        </FormLayout>
        <FormLayout label="其他设置" className="flex gap-4 flex-col">
          <FormItem label="播放模式">
            <OptionGroup
              defaultValue={play_mode}
              setValue={setPlayMode}
              className="flex gap-2"
            >
              <Option value={1} icon={<ListMusic />}>
                顺序播放
              </Option>
              <Option value={2} icon={<RefreshCcwDot />}>
                单曲循环
              </Option>
              <Option value={3} icon={<Shuffle />}>
                随机播放
              </Option>
            </OptionGroup>
          </FormItem>
          <FormItem label="服务器地址">
            <Input
              value={server_url}
              onChange={(value) => setServerUrl(value)}
            />
          </FormItem>
        </FormLayout>
      </div>
    </div>
  );
}

export default SettingsPage;

const FormLayout = ({ label, children, className = "" }: any) => {
  const { isSmallDevice } = useDevice();
  return (
    <div
      className={`${
        isSmallDevice ? "grid-rows-[50px,1fr]" : "grid-cols-[150px,1fr]"
      } grid gap-4`}
    >
      <label className="font-bold">{label}</label>
      <div className={"px-8 py-4 bg-card rounded-lg " + className}>
        {children}
      </div>
    </div>
  );
};

const FormItem = ({ label, children }: any) => {
  const { isSmallDevice } = useDevice();
  return (
    <div
      className={`${
        isSmallDevice
          ? "grid-rows-[25px,1fr] gap-1"
          : "grid-cols-[150px,1fr] gap-4"
      } grid items-center`}
    >
      <label className="text-sm">{label}</label>
      <div className="w-full">{children}</div>
    </div>
  );
};
