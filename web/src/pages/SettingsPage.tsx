// pages/SettingsPage.tsx
import { Input } from "../components/Input";
import { Option, OptionGroup } from "../components/Option";
import { useTheme } from "../components/theme-provider";
import { useDevice } from "../hooks/use-device";
import { scanMusic, scanMusicProgress } from "../lib/api";
import { OnlineEngine, useSettingStore } from "../store/setting";
import {
  ListMusic,
  Moon,
  RefreshCcwDot,
  Settings,
  Shuffle,
  Sun,
} from "lucide-react";
import { toast } from "sonner";
import { KeyboardShortcutViewer } from "../components/KeyboardShortcutViewer";
import { PerformanceMonitor } from "../components/PerformanceMonitor";
import { useState, useRef } from "react";

function SettingsPage() {
  const { play_mode, server_url, online_engine, setPlayMode, setServerUrl, setOnlineEngine, is_running_scan, setIsRunningScan } =
    useSettingStore();

  const { theme, setTheme } = useTheme();
  const [visible, setVisible] = useState(false);
  const scanIntervalRef = useRef<number | null>(null);

  const handleScanMusic = () => {
    if (is_running_scan) {
      return;
    }
    setIsRunningScan(true);
    console.log('scanMusic');

    toast.success("启动扫描，等待完成....");

    // 启动扫描
    scanMusic(
      (result) => {
        if (result.success) {
          toast.success("扫描完成");
          setIsRunningScan(false);
          // 清除轮询
          if (scanIntervalRef.current) {
            clearInterval(scanIntervalRef.current);
            scanIntervalRef.current = null;
          }
        } else {
          toast.error(`扫描失败：${result.message}`);
          setIsRunningScan(false);
          // 清除轮询
          if (scanIntervalRef.current) {
            clearInterval(scanIntervalRef.current);
            scanIntervalRef.current = null;
          }
        }
      },
      (error) => {
        toast.error(`启动扫描线程失败：${error}`);
        setIsRunningScan(false);
        // 清除轮询
        if (scanIntervalRef.current) {
          clearInterval(scanIntervalRef.current);
          scanIntervalRef.current = null;
        }
      }
    );

    // 轮询获取扫描进度
    scanIntervalRef.current = window.setInterval(() => {
      scanMusicProgress(
        (result) => {
          console.log('扫描进度:', result);
          // 这里可以根据返回的进度信息更新 UI
        },
        (error) => {
          console.error('获取扫描进度失败:', error);
        }
      );
    }, 1500);
  };

  return (
    <div className="p-4 overflow-y-scroll flex justify-center items-center">
      <div className="max-w-[860px] w-full gap-4 flex flex-col">

        <FormLayout label="当前版本">
          <div className="flex items-center gap-4">
            <span>v1.2.0</span>
            <span className="text-sm text-gray-400">2025-11-15</span>
          </div>
        </FormLayout>

        <FormLayout label="系统">
          <>
            <span className="button" onClick={() => setVisible(true)}>快捷键</span>
            {/* 性能监控工具 */}
            <KeyboardShortcutViewer visible={visible} setVisible={() => setVisible(false)} />
            <PerformanceMonitor />
          </>
        </FormLayout>

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
          <FormItem label="在线搜索">
            <OptionGroup
              defaultValue={online_engine}
              setValue={setOnlineEngine}
              className="flex gap-2"
            >
              <Option value={OnlineEngine.Bing}>必应</Option>
              <Option value={OnlineEngine.Baidu}>百度</Option>
              <Option value={OnlineEngine.Google}>谷歌</Option>
            </OptionGroup>
          </FormItem>
        </FormLayout>

        <FormLayout label="工具" className="flex gap-4 flex-col">
          <FormItem label="重新扫描">
            <div className="button" onClick={handleScanMusic}>执行</div>
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
      className={`${isSmallDevice ? "grid-rows-[50px,1fr]" : "grid-cols-[150px,1fr]"
        } grid gap-4`}
    >
      <div className="flex items-center">
        <label className="font-bold">{label}</label>
      </div>
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
      className={`${isSmallDevice
        ? "grid-rows-[25px,1fr] gap-1"
        : "grid-cols-[150px,1fr] gap-4"
        } grid items-center`}
    >
      <label className="text-sm">{label}</label>
      <div className="w-full">{children}</div>
    </div>
  );
};
