import type { TrackSummary } from '@music/shared';
import { resolveAssetUrl } from '../utils/assets';

type HomeFeedProps = {
  tracks: TrackSummary[];
  onPlayTrack: (track: TrackSummary) => void;
  onOpenArtist: (artistName: string) => void;
  onOpenLibraryView: () => void;
};

function uniqueByArtist(tracks: TrackSummary[]) {
  const byArtist = new Map<string, TrackSummary>();
  tracks.forEach((track) => {
    if (!byArtist.has(track.artistName)) {
      byArtist.set(track.artistName, track);
    }
  });
  return [...byArtist.values()];
}

export function HomeFeed({ tracks, onPlayTrack, onOpenArtist, onOpenLibraryView }: HomeFeedProps) {
  const artistCards = uniqueByArtist(tracks).slice(0, 8);
  const albumCards = tracks.slice(0, 8);
  const recentCards = [...tracks].reverse().slice(0, 8);

  return (
    <>
      <section className="grid-section">
        <div className="section-header">
          <h2>Nghệ sĩ nổi bật</h2>
          <button onClick={onOpenLibraryView}>Hiện tất cả</button>
        </div>
        <div className="track-grid">
          {artistCards.map((track) => (
            <article className="track-card artist-card" key={`artist-${track.artistName}`}>
              <button className="track-cover" onClick={() => onOpenArtist(track.artistName)}>
                <img src={resolveAssetUrl(track.coverUrl)} alt={track.artistName} />
              </button>
              <strong>{track.artistName}</strong>
              <span>Nghệ sĩ</span>
            </article>
          ))}
        </div>
      </section>

      <section className="grid-section">
        <div className="section-header">
          <h2>Album dành cho bạn</h2>
          <button onClick={onOpenLibraryView}>Hiện tất cả</button>
        </div>
        <div className="track-grid">
          {albumCards.map((track) => (
            <article className="track-card" key={`album-${track.id}`}>
              <button className="track-cover" onClick={() => onPlayTrack(track)}>
                <img src={resolveAssetUrl(track.coverUrl)} alt={track.title} />
              </button>
              <strong>{track.title}</strong>
              <span>{track.artistName}</span>
            </article>
          ))}
        </div>
      </section>

      <section className="grid-section">
        <div className="section-header">
          <h2>Nghe gần đây</h2>
          <button onClick={onOpenLibraryView}>Hiện tất cả</button>
        </div>
        <div className="track-grid">
          {recentCards.map((track) => (
            <article className="track-card" key={`recent-${track.id}`}>
              <button className="track-cover" onClick={() => onPlayTrack(track)}>
                <img src={resolveAssetUrl(track.coverUrl)} alt={track.title} />
              </button>
              <strong>{track.title}</strong>
              <span>{track.artistName}</span>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}

