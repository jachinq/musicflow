import { useEffect, useRef, useState } from 'react'

export interface UseAudioProgressReturn {
  currentTime: number
  duration: number
  playing: boolean
  togglePlay: () => void
  audioRef: React.MutableRefObject<HTMLAudioElement | null>
  onInput: (value: number) => void
  onChange: (value: number) => void
  onDragStart: () => void
  onDragEnd: () => void
  setSrc: (src: string) => void

  volume: number
  setVolume: (volume: number) => void
}

export function useAudioProgress(initialSrc?: string): UseAudioProgressReturn {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const isDraggingRef = useRef(false)

  const [volume, setVolume] = useState(0.25)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [src, setSrc] = useState<string | undefined>(initialSrc)

  useEffect(()=> {
    console.log('[useAudioProgress] audioRef:', audioRef.current)
  }, [audioRef.current])

  // 创建 / 更新 Audio 对象
  useEffect(() => {

    console.log('[useAudioProgress] src changed:', src)

    // 如果已有 audio，先停止
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.src = ''
      audioRef.current = null
      setCurrentTime(0)
      setDuration(0)
      setPlaying(false)
    }
    if (!src) return

    const audio = new Audio(src)
    audioRef.current = audio
    audio.volume = volume
    
    // TODO 用户控制
    // togglePlay()

    const onLoaded = () => setDuration(audio.duration)
    const onTimeUpdate = () => {
       if (!isDraggingRef.current) {
        setCurrentTime(audio.currentTime)
      }
    }
    const onPlay = () => setPlaying(true)
    const onPause = () => setPlaying(false)

    audio.addEventListener('loadedmetadata', onLoaded)
    audio.addEventListener('timeupdate', onTimeUpdate)
    audio.addEventListener('play', onPlay)
    audio.addEventListener('pause', onPause)

    return () => {
      audio.pause()
      audio.removeEventListener('loadedmetadata', onLoaded)
      audio.removeEventListener('timeupdate', onTimeUpdate)
      audio.removeEventListener('play', onPlay)
      audio.removeEventListener('pause', onPause)
    }
  }, [src])

  // 音量控制
  useEffect(() => {
    if (!audioRef.current) return
    audioRef.current.volume = volume
  }, [volume])

  const togglePlay = () => {
    console.log('[useAudioProgress] togglePlay')
    if (!audioRef.current) return
    if (playing) audioRef.current.pause()
    else audioRef.current.play()
  }

  const onInput = (value: number) => {
    setCurrentTime(value) // 拖动中只更新 state
  }

  const onChange = (value: number) => {
    if (!audioRef.current) return
    audioRef.current.currentTime = value // 松手后同步 audio.currentTime
  }

  const onDragStart = () => (isDraggingRef.current = true)
  const onDragEnd = () => (isDraggingRef.current = false)

  return {
    currentTime,
    duration,
    playing,
    togglePlay,
    audioRef,
    onInput,
    onChange,
    onDragStart,
    onDragEnd,
    setSrc,

    volume,
    setVolume,
  }
}
