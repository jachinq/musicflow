// pages/SettingsPage.tsx
import { Input } from "../components/Input";
import { Option, OptionGroup } from "../components/Option";
import { useTheme } from "../components/theme-provider";
import { useDevice } from "../hooks/use-device";
import { scanMusic, scanMusicProgress } from "../lib/api";
import { ScanProgress, ScanStatusEnum } from "../lib/defined";
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
// import { PerformanceMonitor } from "../components/PerformanceMonitor";
import { useState, useRef } from "react";

function SettingsPage() {
  const { play_mode, server_url, online_engine, setPlayMode, setServerUrl, setOnlineEngine } =
    useSettingStore();

  const { theme, setTheme } = useTheme();
  const [visible, setVisible] = useState(false);
  const [scanProgress, setScanProgress] = useState<ScanProgress | null>(null);
  const scanIntervalRef = useRef<number | null>(null);

  // 检查扫描状态的通用方法
  const checkScanStatus = (
    onSuccess?: (progress: ScanProgress) => void,
    onError?: (error: any) => void
  ) => {
    scanMusicProgress(
      (result) => {
        if (result.success && result.data) {
          setScanProgress(result.data);
          onSuccess?.(result.data);
        }
      },
      (error) => {
        console.error('获取扫描进度失败:', error);
        onError?.(error);
      }
    );
  };

  const handleScanMusic = () => {
    // 先检查当前扫描状态
    checkScanStatus(
      (progress) => {
        // 如果正在扫描中，提示用户
        if (progress.status === ScanStatusEnum.Scanning) {
          toast.warning("扫描正在进行中，请等待完成");
          // 启动轮询以显示进度
          if (!scanIntervalRef.current) {
            startPolling();
          }
          return;
        }

        // 否则启动新的扫描
        startScan();
      },
      () => {
        // 获取状态失败，尝试启动扫描
        startScan();
      }
    );
  };

  const startScan = () => {
    console.log('scanMusic');
    toast.success("启动扫描，等待完成....");

    // 启动扫描
    scanMusic(
      (result) => {
        if (result.success) {
          toast.success("扫描任务已启动");
          // 启动轮询
          startPolling();
        } else {
          toast.error(`扫描失败：${result.message}`);
          setScanProgress(null);
        }
      },
      (error) => {
        toast.error(`启动扫描线程失败：${error}`);
        setScanProgress(null);
      }
    );
  };

  const startPolling = () => {
    // 如果已经在轮询中，不重复启动
    if (scanIntervalRef.current) {
      return;
    }

    // 轮询获取扫描进度
    scanIntervalRef.current = window.setInterval(() => {
      checkScanStatus(
        (progress) => {
          console.log('扫描进度:', progress);

          // 如果扫描完成或失败，停止轮询
          if (progress.status === ScanStatusEnum.Completed ||
              progress.status === ScanStatusEnum.Failed) {
            if (scanIntervalRef.current) {
              clearInterval(scanIntervalRef.current);
              scanIntervalRef.current = null;
            }

            if (progress.status === ScanStatusEnum.Completed) {
              toast.success("扫描完成");
            } else if (progress.status === ScanStatusEnum.Failed) {
              toast.error(`扫描失败：${progress.error || '未知错误'}`);
            }

            // 延迟清除进度显示
            setTimeout(() => {
              setScanProgress(null);
            }, 5000); // 5秒后清除进度显示
          }
        }
      );
    }, 5000); // 5秒轮询一次
  };

  return (
    <div className="p-4 overflow-y-scroll flex justify-center items-center">
      <div className="max-w-[860px] w-full gap-4 flex flex-col">

        <FormLayout label="当前版本">
          <div className="flex items-center gap-4">
            <span>v{__APP_VERSION__}</span>
            <span className="text-sm text-gray-400">{__BUILD_DATE__}</span>
          </div>
        </FormLayout>

        <FormLayout label="系统">
          <>
            <span className="cursor-pointer hover:text-primary-hover" onClick={() => setVisible(true)}>快捷键</span>
            {/* 性能监控工具 */}
            <KeyboardShortcutViewer visible={visible} setVisible={() => setVisible(false)} />
            {/* <PerformanceMonitor /> */}
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
            <div className="flex flex-col gap-2">
              <div className="button" onClick={handleScanMusic}>
                {scanProgress?.status === ScanStatusEnum.Scanning ? "扫描中..." : "执行"}
              </div>
              {scanProgress && (
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <div>状态: {scanProgress.status}</div>
                  {scanProgress.total > 0 && (
                    <div>
                      进度: {scanProgress.processed} / {scanProgress.total}
                      ({Math.round((scanProgress.processed / scanProgress.total) * 100)}%)
                    </div>
                  )}
                  {scanProgress.current_file && (
                    <div className="truncate">当前: {scanProgress.current_file}</div>
                  )}
                  {scanProgress.error && (
                    <div className="text-red-500">错误: {scanProgress.error}</div>
                  )}
                </div>
              )}
            </div>
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
