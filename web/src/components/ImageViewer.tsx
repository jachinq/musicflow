import { X } from "lucide-react";
import { useEffect, useState } from "react";

interface ImageViewerProps {
  src: string;
  alt?: string;
  onClose: () => void;
}

export const ImageViewer = ({ src, alt, onClose }: ImageViewerProps) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // 触发动画
    requestAnimationFrame(() => {
      setIsVisible(true);
    });

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    // 禁止背景滚动
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "auto";
    };
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    // 等待动画完成后再关闭
    setTimeout(() => {
      onClose();
    }, 200);
  };

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center transition-all duration-200 ${
        isVisible ? "bg-black/80" : "bg-black/0"
      }`}
      onClick={handleClose}
    >
      <button
        onClick={handleClose}
        className={`absolute top-4 right-4 z-10 p-2 rounded-full bg-black/50 hover:bg-black/70 transition-all duration-200 ${
          isVisible ? "opacity-100 scale-100" : "opacity-0 scale-75"
        }`}
        aria-label="关闭"
      >
        <X size={24} className="text-muted-foreground hover:text-primary-hover" />
      </button>

      <img
        src={src}
        alt={alt}
        className={`max-w-[90vw] max-h-[90vh] object-contain transition-all duration-300 ${
          isVisible ? "opacity-100 scale-100" : "opacity-0 scale-90"
        }`}
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
};
