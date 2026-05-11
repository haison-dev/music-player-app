import { BadRequestException, Injectable } from '@nestjs/common';
import type { TrackSummary } from '@music/shared';

type Playlist = {
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

@Injectable()
export class LibraryService {
  private readonly states = new Map<string, LibraryState>();

  getState(userId: string): LibraryState {
    return this.ensureState(userId);
  }

  toggleLike(userId: string, trackId: string) {
    this.assertNonEmpty('trackId', trackId);
    const state = this.ensureState(userId);
    const hasLike = state.likedTrackIds.includes(trackId);
    state.likedTrackIds = hasLike
      ? state.likedTrackIds.filter((id) => id !== trackId)
      : [...state.likedTrackIds, trackId];
    return state;
  }

  createPlaylist(userId: string, name: string) {
    const state = this.ensureState(userId);
    this.assertNonEmpty('name', name);
    const normalizedName = name.trim();

    if (!normalizedName) {
      throw new BadRequestException('Playlist name is required.');
    }

    const playlist: Playlist = {
      id: `playlist-${Date.now()}`,
      name: normalizedName,
      trackIds: [],
      createdAt: new Date().toISOString(),
    };

    state.playlists = [...state.playlists, playlist];
    return { playlist, state };
  }

  addTrackToPlaylist(userId: string, playlistId: string, trackId: string) {
    this.assertNonEmpty('playlistId', playlistId);
    this.assertNonEmpty('trackId', trackId);
    const state = this.ensureState(userId);
    state.playlists = state.playlists.map((playlist) => {
      if (playlist.id !== playlistId || playlist.trackIds.includes(trackId)) {
        return playlist;
      }
      return { ...playlist, trackIds: [...playlist.trackIds, trackId] };
    });
    return state;
  }

  removeTrackFromPlaylist(userId: string, playlistId: string, trackId: string) {
    this.assertNonEmpty('playlistId', playlistId);
    this.assertNonEmpty('trackId', trackId);
    const state = this.ensureState(userId);
    state.playlists = state.playlists.map((playlist) =>
      playlist.id === playlistId ? { ...playlist, trackIds: playlist.trackIds.filter((id) => id !== trackId) } : playlist,
    );
    return state;
  }

  setSelectedFolder(userId: string, folder: string | null) {
    const state = this.ensureState(userId);
    state.selectedFolder = folder;
    return state;
  }

  upsertUploadedTrack(userId: string, track: TrackSummary) {
    if (!track || !track.id || !track.title || !track.artistName) {
      throw new BadRequestException('track payload is invalid.');
    }
    const state = this.ensureState(userId);
    const exists = state.uploadedTracks.some((item) => item.id === track.id);
    if (!exists) {
      state.uploadedTracks = [...state.uploadedTracks, track];
    }
    return state;
  }

  toggleFollowArtist(userId: string, artistId: string) {
    this.assertNonEmpty('artistId', artistId);
    const state = this.ensureState(userId);
    const followed = state.followedArtistIds.includes(artistId);
    state.followedArtistIds = followed
      ? state.followedArtistIds.filter((id) => id !== artistId)
      : [...state.followedArtistIds, artistId];
    return { followed: !followed, state };
  }

  private ensureState(userId: string): LibraryState {
    this.assertNonEmpty('userId', userId);
    const normalizedId = userId.trim();
    const current = this.states.get(normalizedId);
    if (current) {
      return current;
    }
    const initial: LibraryState = {
      likedTrackIds: [],
      playlists: [],
      uploadedTracks: [],
      selectedFolder: null,
      followedArtistIds: [],
    };
    this.states.set(normalizedId, initial);
    return initial;
  }

  private assertNonEmpty(field: string, value: string) {
    if (typeof value !== 'string' || !value.trim()) {
      throw new BadRequestException(`${field} is required.`);
    }
  }
}
