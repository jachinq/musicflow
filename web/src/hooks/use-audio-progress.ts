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
}

export function useAudioProgress(src: string): UseAudioProgressReturn {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const isDraggingRef = useRef<boolean>(false)

  const [currentTime, setCurrentTime] = useState<number>(0)
  const [duration, setDuration] = useState<number>(0)
  const [playing, setPlaying] = useState<boolean>(false)

  useEffect(() => {
    const audio = new Audio(src)
    audioRef.current = audio

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

  const togglePlay = () => {
    if (!audioRef.current) return
    if (playing) audioRef.current.pause()
    else audioRef.current.play()
  }

  const onInput = (value: number) => {
    setCurrentTime(value)
  }

  const onChange = (value: number) => {
    if (!audioRef.current) return
    audioRef.current.currentTime = value
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
  }
}
