import type { TrackSummary } from '@music/shared';
const API_URL = __API_URL__;

export async function getHealth() {
  const response = await fetch(`${API_URL}/health`);

  if (!response.ok) {
    throw new Error('API health check failed');
  }

  return response.json() as Promise<{ status: string; timestamp: string }>;
}

export async function getFeaturedTracks() {
  const response = await fetch(`${API_URL}/api/tracks/featured`).catch(() => null);

  if (response?.ok) {
    return response.json();
  }

  const terms = ['vpop', 'newjeans', 'jennie', 'post malone', 'olivia rodrigo', 'hieuthuhai'];
  const requests = await Promise.all(
    terms.map(async (term) => {
      const url = `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&entity=song&limit=10`;
      const res = await fetch(url);
      if (!res.ok) {
        return [];
      }
      const payload = (await res.json()) as {
        results?: Array<{
          trackId: number;
          trackName: string;
          artistName: string;
          previewUrl?: string;
          artworkUrl100?: string;
          trackTimeMillis?: number;
        }>;
      };
      return payload.results ?? [];
    }),
  );

  const unique = new Map<string, { id: string; title: string; artistName: string; coverUrl: string | null; audioUrl: string | null; durationSeconds: number }>();
  requests.flat().forEach((song) => {
    if (!song.previewUrl || !song.trackName || !song.artistName || !song.trackId) {
      return;
    }
    const id = `itunes-${song.trackId}`;
    if (unique.has(id)) {
      return;
    }
    unique.set(id, {
      id,
      title: song.trackName,
      artistName: song.artistName,
      coverUrl: song.artworkUrl100 ? song.artworkUrl100.replace('100x100bb', '600x600bb') : null,
      audioUrl: song.previewUrl,
      durationSeconds: Math.max(30, Math.round((song.trackTimeMillis ?? 180000) / 1000)),
    });
  });

  const tracks = [...unique.values()].slice(0, 40);
  if (!tracks.length) {
    throw new Error('Could not load online tracks');
  }
  return tracks;
}

type AuthResult = {
  user: {
    id: string;
    email: string;
    username: string;
    displayName: string;
  };
  message: string;
};

export type LibraryStateDto = {
  likedTrackIds: string[];
  playlists: Array<{
    id: string;
    name: string;
    trackIds: string[];
    createdAt: string;
  }>;
  uploadedTracks: TrackSummary[];
  selectedFolder: string | null;
  followedArtistIds: string[];
};

async function parseResponse<T>(response: Response, fallbackMessage: string): Promise<T> {
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(payload?.message || fallbackMessage);
  }
  return response.json() as Promise<T>;
}

export async function registerAccount(input: {
  email: string;
  username: string;
  displayName: string;
  password: string;
}) {
  const response = await fetch(`${API_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  return parseResponse<AuthResult>(response, 'Could not register.');
}

export async function loginAccount(input: { email: string; password: string }) {
  const response = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  return parseResponse<AuthResult>(response, 'Could not login.');
}

export async function getLibraryState(userId: string) {
  const response = await fetch(`${API_URL}/api/library?userId=${encodeURIComponent(userId)}`);
  return parseResponse<LibraryStateDto>(response, 'Could not load library state.');
}

export async function toggleLikeTrack(userId: string, trackId: string) {
  const response = await fetch(`${API_URL}/api/library/likes/toggle`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, trackId }),
  });
  return parseResponse<LibraryStateDto>(response, 'Could not toggle like.');
}

export async function createPlaylistApi(userId: string, name: string) {
  const response = await fetch(`${API_URL}/api/library/playlists`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, name }),
  });
  return parseResponse<{ playlist: LibraryStateDto['playlists'][number]; state: LibraryStateDto }>(
    response,
    'Could not create playlist.',
  );
}

export async function addTrackToPlaylistApi(userId: string, playlistId: string, trackId: string) {
  const response = await fetch(`${API_URL}/api/library/playlists/${playlistId}/tracks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, trackId }),
  });
  return parseResponse<LibraryStateDto>(response, 'Could not add track to playlist.');
}

export async function removeTrackFromPlaylistApi(userId: string, playlistId: string, trackId: string) {
  const response = await fetch(
    `${API_URL}/api/library/playlists/${playlistId}/tracks/${trackId}?userId=${encodeURIComponent(userId)}`,
    {
      method: 'DELETE',
    },
  );
  return parseResponse<LibraryStateDto>(response, 'Could not remove track from playlist.');
}

export async function setSelectedFolderApi(userId: string, folder: string | null) {
  const response = await fetch(`${API_URL}/api/library/selected-folder`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, folder }),
  });
  return parseResponse<LibraryStateDto>(response, 'Could not update selected folder.');
}

export async function uploadTrackApi(userId: string, track: TrackSummary) {
  const response = await fetch(`${API_URL}/api/library/uploads`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, track }),
  });
  return parseResponse<LibraryStateDto>(response, 'Could not upload local track.');
}

export async function uploadAudioFileApi(input: {
  artistName: string;
  audio: Blob;
  coverUrl: string | null;
  durationSeconds: number;
  fileName: string;
  selectedFolder: string | null;
  title: string;
  userId: string;
}) {
  const body = new FormData();
  body.set('userId', input.userId);
  body.set('title', input.title);
  body.set('artistName', input.artistName);
  body.set('durationSeconds', String(input.durationSeconds));

  if (input.coverUrl) {
    body.set('coverUrl', input.coverUrl);
  }

  if (input.selectedFolder) {
    body.set('selectedFolder', input.selectedFolder);
  }

  body.set('audio', input.audio, input.fileName);

  const response = await fetch(`${API_URL}/api/library/uploads/audio`, {
    method: 'POST',
    body,
  });
  return parseResponse<LibraryStateDto>(response, 'Could not upload audio file.');
}

export async function toggleFollowArtistApi(userId: string, artistId: string) {
  const response = await fetch(`${API_URL}/api/library/follows/toggle`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, artistId }),
  });
  return parseResponse<{ followed: boolean; state: LibraryStateDto }>(response, 'Could not follow artist.');
}

export async function trackUiAction(action: string, userId?: string, context?: string) {
  const response = await fetch(`${API_URL}/api/actions/track`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, userId, context }),
  });
  return parseResponse<{ ok: boolean }>(response, 'Could not track action.');
}
