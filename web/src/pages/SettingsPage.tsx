// pages/SettingsPage.tsx
import { Input } from "../components/Input";
import { ThemeToggle } from "../components/theme-toggle";
import { useSettingStore } from "../store/setting";

function SettingsPage() {
    const {play_mode, server_url, setPlayMode, setServerUrl} = useSettingStore();
  return (
    <div className="p-4 overflow-scroll flex justify-center items-center">
      <div className="max-w-[860px] w-full gap-4 flex flex-col">
        <FormLayout label="主题">
          <ThemeToggle />
        </FormLayout>
        <FormLayout label="其他设置" className="flex gap-4 flex-col">
          <FormItem label="播放模式">
            <div className="flex gap-2">
            <Option value={1} defaultValue={play_mode} setValue={setPlayMode}>顺序播放</Option>
            <Option value={2} defaultValue={play_mode} setValue={setPlayMode}>单曲循环</Option>
            <Option value={3} defaultValue={play_mode} setValue={setPlayMode}>随机播放</Option>
            </div>
          </FormItem>
          <FormItem label="服务器地址">
            <Input value={server_url} onChange={(value) => setServerUrl(value)} />
          </FormItem>
        </FormLayout>
      </div>
    </div>
  );
}

export default SettingsPage;

const FormLayout = ({ label, children, className="" }: any) => {
  return (
    <div className="grid grid-cols-[150px,1fr] gap-4 items-center">
      <label className="font-bold">{label}</label>
      <div className={"p-4 bg-card rounded-lg " + className}>{children}</div>
    </div>
  );
};

const FormItem = ({ label, children }: any) => {
  return (
    <div className="grid grid-cols-[150px,1fr] items-center gap-4">
      <label className="text-sm">{label}</label>
      <div className="w-full">{children}</div>
    </div>
  );
};

const Option = ({ value, setValue, defaultValue, ...props }: { value: any, setValue: any, defaultValue: any} & React.HTMLAttributes<HTMLDivElement>) => {
  
    return (
      <div className={`${value===defaultValue && "text-blue-500"} cursor-pointer hover:text-primary-hover  `} {...props}  onClick={() => setValue && setValue(value)} ></div>
    )
  }