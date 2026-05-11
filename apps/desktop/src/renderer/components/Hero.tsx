import type { AuthUser } from '../stores/authStore';
import type { Playlist } from '../stores/libraryStore';
import type { View } from '../types';
import type { TrackSummary } from '@music/shared';
import { formatDuration } from '../utils/formatDuration';

type HeroProps = {
  activePlaylist: Playlist | null;
  activeView: View;
  notice: string;
  selectedFolder: string | null;
  tracks: TrackSummary[];
  user: AuthUser | null;
};

export function Hero({ activePlaylist, activeView, notice, selectedFolder, tracks, user }: HeroProps) {
  const totalDuration = tracks.reduce((total, track) => total + track.durationSeconds, 0);
  const title = activeView === 'Playlist' && activePlaylist
    ? activePlaylist.name
    : activeView === 'Liked Tracks'
      ? 'Bài hát đã thích'
      : activeView === 'Uploads'
        ? 'Uploads'
        : 'VPOP';
  const subtitle = selectedFolder
    ? `Selected folder: ${selectedFolder}`
    : user
      ? `${user.displayName} • ${tracks.length} bài hát, ${formatDuration(totalDuration)}`
      : notice;

  return (
    <section className="hero playlist-hero">
      <div className="playlist-cover-stack">
        {tracks.slice(0, 4).map((track) => (
          <img key={track.id} src={track.coverUrl || '/assets/covers/poster.png'} alt="" />
        ))}
        {tracks.length === 0 && <img src="/assets/covers/poster.png" alt="" />}
      </div>
      <div className="hero-copy">
        <p className="eyebrow">{activeView === 'Playlist' || activeView === 'Liked Tracks' ? 'Danh sách phát công khai' : 'Danh sách phát'}</p>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
    </section>
  );
}
