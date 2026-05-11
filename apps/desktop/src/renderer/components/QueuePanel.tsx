import { ListMusic, PanelRightClose } from 'lucide-react';
import type { TrackSummary } from '@music/shared';

type QueuePanelProps = {
  activeTrack: TrackSummary;
  queue: TrackSummary[];
  tracks: TrackSummary[];
  onClose: () => void;
  onPlayTrack: (track: TrackSummary) => void;
};

export function QueuePanel({ activeTrack, queue, tracks, onClose, onPlayTrack }: QueuePanelProps) {
  return (
    <aside className="right-panel">
      <div className="panel-header">
        <h2>VPOP</h2>
        <div className="panel-actions">
          <button className="icon-button" aria-label="Hide now playing" onClick={onClose}>
            <PanelRightClose size={18} />
          </button>
          <ListMusic size={18} />
        </div>
      </div>
      <div className="now-card spotlight-card">
        <img src={activeTrack.coverUrl || '/assets/covers/poster.png'} alt="" />
        <div className="spotlight-meta">
          <strong>{activeTrack.title}</strong>
          <span>{activeTrack.artistName}</span>
        </div>
      </div>
      <h3 className="queue-heading">Danh sách chờ</h3>
      <div className="queue-list">
        {(queue.length ? queue : tracks).map((track) => (
          <button
            className={`queue-item ${activeTrack.id === track.id ? 'playing' : ''}`}
            key={track.id}
            onClick={() => onPlayTrack(track)}
          >
            <img src={track.coverUrl || '/assets/covers/poster.png'} alt="" />
            <span>{track.title}</span>
          </button>
        ))}
      </div>
    </aside>
  );
}
