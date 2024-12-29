import { useMediaQuery, useWindowSize } from "@uidotdev/usehooks";

export const useDevice = () => {
  const isSmallDevice = useMediaQuery("only screen and (max-width : 768px)");
  const isMediumDevice = useMediaQuery("only screen and (min-width : 768px) and (max-width : 1024px)");
  const isLargeDevice = useMediaQuery("only screen and (min-width : 1024px) and (max-width : 1560px)");
  const isHugeDevice = useMediaQuery("only screen and (min-width : 1560px)");
  const { width, height } = useWindowSize();

  return {
    isSmallDevice,
    isMediumDevice,
    isLargeDevice,
    isHugeDevice,
    windowWidth: width,
    windowHeight: height
  }

}