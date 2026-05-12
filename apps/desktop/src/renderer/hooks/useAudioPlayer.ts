import { useEffect, useRef, useState } from 'react';
import type { TrackSummary } from '@music/shared';
import { usePlayerStore } from '../stores/playerStore';
import { resolveAssetUrl, resolveLocalFileUrl } from '../utils/assets';

export function useAudioPlayer(allTracks: TrackSummary[]) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const {
    currentTrack,
    isPlaying,
    isShuffleOn,
    queue,
    volume,
    setTrack,
    togglePlay,
    toggleShuffle,
    setPlaying,
    setQueue,
    setVolume,
  } = usePlayerStore();

  const activeTrack = currentTrack ?? allTracks[0];
  const activeDuration = duration || activeTrack?.durationSeconds || 0;
  const progressPercent = activeDuration > 0 ? (currentTime / activeDuration) * 100 : 0;

  useEffect(() => {
    if (!isShuffleOn) {
      setQueue(allTracks);
    }
  }, [isShuffleOn, setQueue, allTracks]);

  useEffect(() => {
    const audio = audioRef.current;

    if (!audio || !activeTrack?.audioUrl) {
      return;
    }

    audio.src = resolveAssetUrl(resolveLocalFileUrl(activeTrack.audioUrl), '');
    audio.volume = volume;
    setCurrentTime(0);
    setDuration(activeTrack.durationSeconds);
  }, [activeTrack]);

  useEffect(() => {
    const audio = audioRef.current;

    if (audio) {
      audio.volume = volume;
    }
  }, [volume]);

  useEffect(() => {
    const audio = audioRef.current;

    if (!audio) {
      return;
    }

    if (isPlaying) {
      void audio.play().catch(() => setPlaying(false));
    } else {
      audio.pause();
    }
  }, [isPlaying, setPlaying]);

  function playTrack(track: TrackSummary) {
    setTrack(track, allTracks);
  }

  function playNext() {
    const source = queue.length ? queue : allTracks;

    if (!activeTrack || source.length === 0) {
      return;
    }

    const currentIndex = source.findIndex((track) => track.id === activeTrack.id);
    const nextTrack = source[(currentIndex + 1 + source.length) % source.length];
    setTrack(nextTrack, source);
  }

  function playPrevious() {
    const source = queue.length ? queue : allTracks;

    if (!activeTrack || source.length === 0) {
      return;
    }

    const currentIndex = source.findIndex((track) => track.id === activeTrack.id);
    const previousTrack = source[(currentIndex - 1 + source.length) % source.length];
    setTrack(previousTrack, source);
  }

  function buildShuffledQueue() {
    const remainingTracks = activeTrack
      ? allTracks.filter((track) => track.id !== activeTrack.id)
      : [...allTracks];

    for (let index = remainingTracks.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [remainingTracks[index], remainingTracks[swapIndex]] = [remainingTracks[swapIndex], remainingTracks[index]];
    }

    return activeTrack ? [activeTrack, ...remainingTracks] : remainingTracks;
  }

  function toggleShuffleMode() {
    const nextShuffleState = !isShuffleOn;

    toggleShuffle();

    if (nextShuffleState) {
      setQueue(buildShuffledQueue());
    } else {
      setQueue(allTracks);
    }
  }

  function shuffleQueue() {
    const shuffled = buildShuffledQueue();

    if (shuffled.length === 0) {
      return;
    }

    setQueue(shuffled);
    setTrack(shuffled[0], shuffled);
  }

  function seek(value: string) {
    const nextTime = Number(value);
    const audio = audioRef.current;

    if (audio) {
      audio.currentTime = nextTime;
    }

    setCurrentTime(nextTime);
  }

  return {
    activeDuration,
    activeTrack,
    audioRef,
    currentTime,
    isShuffleOn,
    isPlaying,
    playNext,
    playPrevious,
    playTrack,
    progressPercent,
    queue,
    seek,
    setDuration,
    setCurrentTime,
    setVolume,
    shuffleQueue,
    toggleShuffleMode,
    togglePlay,
    volume,
  };
}
