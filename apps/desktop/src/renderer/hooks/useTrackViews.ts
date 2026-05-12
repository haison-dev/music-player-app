import { useMemo } from 'react';
import type { TrackSummary } from '@music/shared';
import type { Playlist } from '../stores/libraryStore';
import type { View } from '../types';

type UseTrackViewsParams = {
  uploadedTracks: TrackSummary[];
  query: string;
  activeView: View;
  activePlaylistId: string | null;
  likedTrackIds: string[];
  playlists: Playlist[];
};

export function useTrackViews({
  uploadedTracks,
  query,
  activeView,
  activePlaylistId,
  likedTrackIds,
  playlists,
}: UseTrackViewsParams) {
  const allTracks = useMemo(() => {
    const byId = new Map<string, TrackSummary>();

    uploadedTracks.forEach((track) => byId.set(track.id, track));
    return [...byId.values()];
  }, [uploadedTracks]);

  const activePlaylist = playlists.find((playlist) => playlist.id === activePlaylistId) ?? null;

  const filteredTracks = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return allTracks;
    }

    return allTracks.filter((track) =>
      `${track.title} ${track.artistName}`.toLowerCase().includes(normalizedQuery),
    );
  }, [query, allTracks]);

  const visibleTracks = useMemo(() => {
    if (activeView === 'Liked Tracks') {
      return filteredTracks.filter((track) => likedTrackIds.includes(track.id));
    }

    if (activeView === 'Uploads') {
      return filteredTracks.filter((track) => uploadedTracks.some((uploaded) => uploaded.id === track.id));
    }

    if (activeView === 'Playlist' && activePlaylist) {
      return filteredTracks.filter((track) => activePlaylist.trackIds.includes(track.id));
    }

    return filteredTracks;
  }, [activePlaylist, activeView, filteredTracks, likedTrackIds, uploadedTracks]);

  return {
    activePlaylist,
    allTracks,
    visibleTracks,
  };
}
