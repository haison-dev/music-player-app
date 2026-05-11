import { create } from 'zustand';
import type { TrackSummary } from '@music/shared';

type PlayerState = {
  currentTrack: TrackSummary | null;
  isPlaying: boolean;
  isShuffleOn: boolean;
  queue: TrackSummary[];
  volume: number;
  setTrack: (track: TrackSummary, queue?: TrackSummary[]) => void;
  togglePlay: () => void;
  toggleShuffle: () => void;
  setPlaying: (isPlaying: boolean) => void;
  setQueue: (tracks: TrackSummary[]) => void;
  setVolume: (volume: number) => void;
};

export const usePlayerStore = create<PlayerState>((set) => ({
  currentTrack: null,
  isPlaying: false,
  isShuffleOn: false,
  queue: [],
  volume: 0.7,
  setTrack: (track, queue) =>
    set((state) => ({
      currentTrack: track,
      isPlaying: true,
      queue: queue ?? state.queue,
    })),
  togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),
  toggleShuffle: () => set((state) => ({ isShuffleOn: !state.isShuffleOn })),
  setPlaying: (isPlaying) => set({ isPlaying }),
  setQueue: (tracks) => set({ queue: tracks }),
  setVolume: (volume) => set({ volume }),
}));
