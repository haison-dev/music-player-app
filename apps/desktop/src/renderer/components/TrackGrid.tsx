import { Plus } from 'lucide-react';
import type { TrackSummary } from '@music/shared';
import { resolveAssetUrl } from '../utils/assets';

type TrackGridProps = {
  activeTrackId: string;
  title: string;
  tracks: TrackSummary[];
  onAddToPlaylist: (track: TrackSummary) => void;
  onPlayTrack: (track: TrackSummary) => void;
  onViewAll: () => void;
};

export function TrackGrid({ activeTrackId, title, tracks, onAddToPlaylist, onPlayTrack, onViewAll }: TrackGridProps) {
  return (
    <section className="grid-section">
      <div className="section-header">
        <h2>{title}</h2>
        <button onClick={onViewAll}>View all</button>
      </div>
      <div className="track-grid">
        {tracks.map((track) => (
          <article className={`track-card ${activeTrackId === track.id ? 'playing' : ''}`} key={track.id}>
            <button className="track-cover" onClick={() => onPlayTrack(track)}>
              <img src={resolveAssetUrl(track.coverUrl)} alt="" />
            </button>
            <strong>{track.title}</strong>
            <span>{track.artistName}</span>
            <div className="track-actions">
              <button onClick={() => onPlayTrack(track)}>Play</button>
              <button onClick={() => onAddToPlaylist(track)}>
                <Plus size={14} />
                Playlist
              </button>
            </div>
          </article>
        ))}
        {tracks.length === 0 && <p className="empty-state">No tracks found.</p>}
      </div>
    </section>
  );
}
