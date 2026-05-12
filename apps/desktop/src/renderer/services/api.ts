import type { TrackSummary } from '@music/shared';

const API_URL = __API_URL__;

export async function getHealth() {
  const response = await fetch(`${API_URL}/health`);

  if (!response.ok) {
    throw new Error('API health check failed');
  }

  return response.json() as Promise<{ status: string; timestamp: string }>;
}

type AuthResult = {
  user: {
    id: string;
    email: string;
    username: string;
    displayName: string;
  };
  accessToken: string;
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

function authHeaders(accessToken: string) {
  return {
    Authorization: `Bearer ${accessToken}`,
  };
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

export async function getLibraryState(accessToken: string) {
  const response = await fetch(`${API_URL}/api/library`, {
    headers: authHeaders(accessToken),
  });
  return parseResponse<LibraryStateDto>(response, 'Could not load library state.');
}

export async function toggleLikeTrack(accessToken: string, trackId: string) {
  const response = await fetch(`${API_URL}/api/library/likes/toggle`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders(accessToken) },
    body: JSON.stringify({ trackId }),
  });
  return parseResponse<LibraryStateDto>(response, 'Could not toggle like.');
}

export async function createPlaylistApi(accessToken: string, name: string) {
  const response = await fetch(`${API_URL}/api/library/playlists`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders(accessToken) },
    body: JSON.stringify({ name }),
  });
  return parseResponse<{ playlist: LibraryStateDto['playlists'][number]; state: LibraryStateDto }>(
    response,
    'Could not create playlist.',
  );
}

export async function addTrackToPlaylistApi(accessToken: string, playlistId: string, trackId: string) {
  const response = await fetch(`${API_URL}/api/library/playlists/${playlistId}/tracks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders(accessToken) },
    body: JSON.stringify({ trackId }),
  });
  return parseResponse<LibraryStateDto>(response, 'Could not add track to playlist.');
}

export async function removeTrackFromPlaylistApi(accessToken: string, playlistId: string, trackId: string) {
  const response = await fetch(`${API_URL}/api/library/playlists/${playlistId}/tracks/${trackId}`, {
    method: 'DELETE',
    headers: authHeaders(accessToken),
  });
  return parseResponse<LibraryStateDto>(response, 'Could not remove track from playlist.');
}

export async function setSelectedFolderApi(accessToken: string, folder: string | null) {
  const response = await fetch(`${API_URL}/api/library/selected-folder`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeaders(accessToken) },
    body: JSON.stringify({ folder }),
  });
  return parseResponse<LibraryStateDto>(response, 'Could not update selected folder.');
}

export async function uploadTrackApi(accessToken: string, track: TrackSummary) {
  const response = await fetch(`${API_URL}/api/library/uploads`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders(accessToken) },
    body: JSON.stringify({ track }),
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
  accessToken: string;
}) {
  const body = new FormData();
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
    headers: authHeaders(input.accessToken),
    body,
  });
  return parseResponse<LibraryStateDto>(response, 'Could not upload audio file.');
}

export async function toggleFollowArtistApi(accessToken: string, artistId: string) {
  const response = await fetch(`${API_URL}/api/library/follows/toggle`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders(accessToken) },
    body: JSON.stringify({ artistId }),
  });
  return parseResponse<{ followed: boolean; state: LibraryStateDto }>(
    response,
    'Could not follow artist.',
  );
}

export async function trackUiAction(action: string, userId?: string, context?: string) {
  const response = await fetch(`${API_URL}/api/actions/track`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, userId, context }),
  });
  return parseResponse<{ ok: boolean }>(response, 'Could not track action.');
}
