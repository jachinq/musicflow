import { ImageIcon, Loader } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";

enum RoundType {
  circle = "circle",
  card_text = "card_text",
}

interface CoverProps {
  src: string;
  defaultSrc?: string;
  alt?: string;
  roundType?: RoundType | string;
  size?: number;
  fallback?: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

export const Cover = ({
  src,
  defaultSrc,
  alt,
  className,
  roundType,
  size = 140,
  fallback = <ImageIcon />,
  onClick,
}: CoverProps & React.HTMLAttributes<HTMLDivElement>) => {
  const [loaded, setLoaded] = useState(false);
  const [showFallback, setShowFallback] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Intersection Observer 用于检测元素是否可见
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            // 一旦可见就不再观察
            if (containerRef.current) {
              observer.unobserve(containerRef.current);
            }
          }
        });
      },
      {
        rootMargin: "50px", // 提前50px开始加载
        threshold: 0.01,
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      if (containerRef.current) {
        observer.unobserve(containerRef.current);
      }
    };
  }, []);

  // 仅在可见时加载图片
  useEffect(() => {
    if (!isVisible) return;

    setShowFallback(false);
    setLoaded(false);
    if (!src) {
      setLoaded(true);
      setShowFallback(true);
      return;
    }
    const img = new Image();
    img.src = src;
    img.onload = () => {
      if (imgRef.current) {
        imgRef.current.src = img.src;
        imgRef.current.style.display = "block";
      }
      setLoaded(true);
    };
    img.onerror = () => {
      if (imgRef.current) {
        if (fallback) {
          setShowFallback(true);
        } else {
          imgRef.current.src =
            defaultSrc ||
            "data:image/webp;base64,UklGRpYBAABXRUJQVlA4IIoBAACQEgCdASrAAMAAP3G42GK0sayopLkoEpAuCWVu4QXUMQU4nn/pWmF9o0DPifE+JlGhgZqOyVZgoy7NXUtGklgA0aiSG2RF2Kbm5jQ3eoKwLpyF9R8oVd509SVeXb/tHglG1W4wL8vovtTUJhW/Jxy+Dz2kkbDPiXZ2AE9bwGmE/rM3PifIKeoZRVuuc6yX3BGpY5qSDk0eFGcLFyoAAP1V/+KHvw994S1rsgmSb8eM4Ys0mSvZP+IPrAhBml27fCTgPcHy1S6f9iSr6o2btNKixxetBHWT70dP+hIZITsA3mwH6GT6Jph31q2YsJASsCnDSmiO9ctjViN5bcVXcoIwwUZTu+9jQATMseG7OR/yl1R++egpeBnLRwGRtbdMgxlpe/+cJM8j1XCD0gwSVPZDBJ2Ke/IK/iCzWPuDO2Nw6aGgfb5Rbhor4l+4FDZjWdPVG9qP3AimXDGjWyUPw1fYuf4rBYVj4XiNln/QypsIcatiR5DVPn/YR0CBfMXURwr5Dg+721oAAAAA";
          imgRef.current.style.display = "block";
        }
      }
      setLoaded(true);
    };
    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [isVisible, src, defaultSrc]);

  const getStyle = () => {
    let sizePx = size + "px";
    const style_fixed = {
      borderRadius: "8px",
      minWidth: sizePx,
      minHeight: sizePx,
      maxWidth: sizePx,
      maxHeight: sizePx,
    };
    if (roundType === "card_text") {
      style_fixed.borderRadius = "8px 8px 0 0"
    }
    if (roundType === "circle") {
      style_fixed.borderRadius = "50%"
    }
    
    return style_fixed;
  };

  return (
    <div
      ref={containerRef}
      onClick={onClick}
      style={getStyle()}
      className={"flex items-center justify-center bg-muted shadow-md overflow-hidden " +
        className}
    >
      {!showFallback && (<img ref={imgRef} className="object-cover hidden" alt={alt} style={{width: size + "px", height: size + "px"}} />)
      }
      {showFallback && <div className="bg-muted flex justify-center items-center overflow-hidden break-keep text-center p-4" style={getStyle()}>{fallback}</div>}
      {!loaded && <Loader className="animate-spin" size={32} />}
    </div>
  );
};
