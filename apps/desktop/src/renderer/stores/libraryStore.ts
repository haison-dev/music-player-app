import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { TrackSummary } from '@music/shared';

export type Playlist = {
  id: string;
  name: string;
  trackIds: string[];
  createdAt: string;
};

type LibraryState = {
  likedTrackIds: string[];
  playlists: Playlist[];
  uploadedTracks: TrackSummary[];
  selectedFolder: string | null;
  followedArtistIds: string[];
};

export const useLibraryStore = create<LibraryState>()(
  persist(
    () => ({
      likedTrackIds: [],
      playlists: [],
      uploadedTracks: [],
      selectedFolder: null,
      followedArtistIds: [],
    }),
    {
      name: 'music-platform-library',
    },
  ),
);
