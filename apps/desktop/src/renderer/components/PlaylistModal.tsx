import { X } from 'lucide-react';
import type { FormEvent } from 'react';
import type { TrackSummary } from '@music/shared';
import type { Playlist } from '../stores/libraryStore';

type PlaylistModalProps = {
  pendingTrack: TrackSummary | null;
  playlistName: string;
  playlists: Playlist[];
  onAddToPlaylist: (playlistId: string) => void;
  onClose: () => void;
  onPlaylistNameChange: (name: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function PlaylistModal({
  pendingTrack,
  playlistName,
  playlists,
  onAddToPlaylist,
  onClose,
  onPlaylistNameChange,
  onSubmit,
}: PlaylistModalProps) {
  return (
    <div className="modal-backdrop">
      <div className="modal">
        <button className="modal-close" type="button" onClick={onClose}>
          <X size={18} />
        </button>
        <h2>{pendingTrack ? `Add "${pendingTrack.title}"` : 'Create playlist'}</h2>
        {pendingTrack && playlists.length > 0 && (
          <div className="playlist-picker">
            {playlists.map((playlist) => (
              <button key={playlist.id} onClick={() => onAddToPlaylist(playlist.id)}>
                {playlist.name}
                <span>{playlist.trackIds.length} tracks</span>
              </button>
            ))}
          </div>
        )}
        <form className="inline-form" onSubmit={onSubmit}>
          <input
            placeholder="Playlist name"
            value={playlistName}
            onChange={(event) => onPlaylistNameChange(event.target.value)}
          />
          <button className="primary-action" type="submit">
            Create
          </button>
        </form>
      </div>
    </div>
  );
}
