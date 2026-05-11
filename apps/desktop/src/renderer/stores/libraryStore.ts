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
  toggleLike: (trackId: string) => void;
  createPlaylist: (name: string) => Playlist;
  addTrackToPlaylist: (playlistId: string, trackId: string) => void;
  removeTrackFromPlaylist: (playlistId: string, trackId: string) => void;
  setSelectedFolder: (folder: string | null) => void;
  addUploadedTrack: (track: TrackSummary) => void;
};

export const useLibraryStore = create<LibraryState>()(
  persist(
    (set, get) => ({
      likedTrackIds: [],
      playlists: [],
      uploadedTracks: [],
      selectedFolder: null,
      followedArtistIds: [],
      toggleLike: (trackId) =>
        set((state) => ({
          likedTrackIds: state.likedTrackIds.includes(trackId)
            ? state.likedTrackIds.filter((id) => id !== trackId)
            : [...state.likedTrackIds, trackId],
        })),
      createPlaylist: (name) => {
        const playlist = {
          id: `playlist-${Date.now()}`,
          name: name.trim(),
          trackIds: [],
          createdAt: new Date().toISOString(),
        };

        if (!playlist.name) {
          throw new Error('Playlist name is required.');
        }

        set((state) => ({
          playlists: [...state.playlists, playlist],
        }));

        return playlist;
      },
      addTrackToPlaylist: (playlistId, trackId) =>
        set((state) => ({
          playlists: state.playlists.map((playlist) => {
            if (playlist.id !== playlistId || playlist.trackIds.includes(trackId)) {
              return playlist;
            }

            return {
              ...playlist,
              trackIds: [...playlist.trackIds, trackId],
            };
          }),
        })),
      removeTrackFromPlaylist: (playlistId, trackId) =>
        set((state) => ({
          playlists: state.playlists.map((playlist) =>
            playlist.id === playlistId
              ? {
                  ...playlist,
                  trackIds: playlist.trackIds.filter((id) => id !== trackId),
                }
              : playlist,
          ),
        })),
      setSelectedFolder: (folder) => set({ selectedFolder: folder }),
      addUploadedTrack: (track) => {
        const exists = get().uploadedTracks.some((item) => item.id === track.id);

        if (!exists) {
          set((state) => ({ uploadedTracks: [...state.uploadedTracks, track] }));
        }
      },
    }),
    {
      name: 'music-platform-library',
    },
  ),
);
