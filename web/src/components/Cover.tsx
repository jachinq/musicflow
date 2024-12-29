import { Loader } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";

interface CoverProps {
  src: string;
  defaultSrc?: string;
  alt?: string;
  type?: string;
}

export const Cover = ({
  src: url,
  defaultSrc,
  alt,
  className,
  type = "album",
}: CoverProps & React.HTMLAttributes<HTMLDivElement>) => {
  const [loaded, setLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  useEffect(() => {
    if (!url) {
      setLoaded(true);
      return;
    }
    const img = new Image();
    img.src = url;
    img.onload = () => {
      setLoaded(true);
      // console.log(imgRef.current);
      if (imgRef.current) {
        imgRef.current.src = img.src;
        imgRef.current.style.display = "block";
      }
    };
    img.onerror = () => {
      setLoaded(true);
      if (imgRef.current) {
        imgRef.current.src =
          defaultSrc ||
          "data:image/webp;base64,UklGRpYBAABXRUJQVlA4IIoBAACQEgCdASrAAMAAP3G42GK0sayopLkoEpAuCWVu4QXUMQU4nn/pWmF9o0DPifE+JlGhgZqOyVZgoy7NXUtGklgA0aiSG2RF2Kbm5jQ3eoKwLpyF9R8oVd509SVeXb/tHglG1W4wL8vovtTUJhW/Jxy+Dz2kkbDPiXZ2AE9bwGmE/rM3PifIKeoZRVuuc6yX3BGpY5qSDk0eFGcLFyoAAP1V/+KHvw994S1rsgmSb8eM4Ys0mSvZP+IPrAhBml27fCTgPcHy1S6f9iSr6o2btNKixxetBHWT70dP+hIZITsA3mwH6GT6Jph31q2YsJASsCnDSmiO9ctjViN5bcVXcoIwwUZTu+9jQATMseG7OR/yl1R++egpeBnLRwGRtbdMgxlpe/+cJM8j1XCD0gwSVPZDBJ2Ke/IK/iCzWPuDO2Nw6aGgfb5Rbhor4l+4FDZjWdPVG9qP3AimXDGjWyUPw1fYuf4rBYVj4XiNln/QypsIcatiR5DVPn/YR0CBfMXURwr5Dg+721oAAAAA";
        imgRef.current.style.display = "block";
      }
    };
    return () => {
      img.onload = null;
    };
  }, [url, defaultSrc]);

  return (
    <div
      style={type === "album" ? { borderRadius: "8px 8px 0 0" } : {borderRadius: "8px"}}
      className={
        "min-h-[140px] min-w-[140px] flex items-center justify-center bg-background shadow-md overflow-hidden " +
        className
      }
    >
      <img ref={imgRef} width={140} className="object-cover hidden" alt={alt} />
      {!loaded && <Loader className="animate-spin" size={32} />}
    </div>
  );
};
