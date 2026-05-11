import { UserRound } from 'lucide-react';
import type { TrackSummary } from '@music/shared';
import type { AuthUser } from '../stores/authStore';
import type { Playlist } from '../stores/libraryStore';
import { formatDuration } from '../utils/formatDuration';

type UserProfileProps = {
  user: AuthUser | null;
  tracks: TrackSummary[];
  playlists: Playlist[];
  likedTrackIds: string[];
  followedArtistIds: string[];
  onPlayTrack: (track: TrackSummary) => void;
  onOpenPlaylist: (playlistId: string) => void;
};

function getFollowedArtists(tracks: TrackSummary[], followedArtistIds: string[]) {
  const byArtist = new Map<string, TrackSummary>();
  tracks.forEach((track) => {
    const artistId = track.artistName.toLowerCase().replace(/\s+/g, '-');
    if (!byArtist.has(artistId)) {
      byArtist.set(artistId, track);
    }
  });

  const followed = followedArtistIds
    .map((artistId) => byArtist.get(artistId))
    .filter((track): track is TrackSummary => Boolean(track));

  if (followed.length) {
    return followed;
  }

  return [...byArtist.values()].slice(0, 6);
}

export function UserProfile({
  user,
  tracks,
  playlists,
  likedTrackIds,
  followedArtistIds,
  onPlayTrack,
  onOpenPlaylist,
}: UserProfileProps) {
  const displayName = user?.displayName || 'Người dùng';
  const topTracks = tracks.filter((track) => likedTrackIds.includes(track.id)).slice(0, 5);
  const publicPlaylists = playlists.slice(0, 8);
  const followedArtists = getFollowedArtists(tracks, followedArtistIds);
  const totalDuration = topTracks.reduce((sum, track) => sum + track.durationSeconds, 0);

  return (
    <section className="profile-page">
      <header className="profile-hero">
        <div className="profile-avatar">
          <UserRound size={82} />
        </div>
        <div className="profile-copy">
          <p className="profile-eyebrow">Hồ sơ</p>
          <h1>{displayName}</h1>
          <p>
            {publicPlaylists.length} playlist công khai • {followedArtists.length} đang theo dõi
          </p>
        </div>
      </header>

      <section className="profile-section">
        <h2>Bản nhạc hàng đầu tháng này</h2>
        <small>
          {topTracks.length} bài hát • {formatDuration(totalDuration)}
        </small>
        <div className="profile-track-list">
          {topTracks.map((track, index) => (
            <button className="profile-track-row" key={track.id} onClick={() => onPlayTrack(track)}>
              <span>{index + 1}</span>
              <img src={track.coverUrl || '/assets/covers/poster.png'} alt={track.title} />
              <div>
                <strong>{track.title}</strong>
                <small>{track.artistName}</small>
              </div>
              <small>{formatDuration(track.durationSeconds)}</small>
            </button>
          ))}
          {!topTracks.length && <p className="empty-state">Chưa có bài hát yêu thích.</p>}
        </div>
      </section>

      <section className="profile-section">
        <h2>Playlist công khai</h2>
        <div className="profile-card-grid">
          {publicPlaylists.map((playlist) => (
            <button className="profile-card" key={playlist.id} onClick={() => onOpenPlaylist(playlist.id)}>
              <img src="/assets/covers/poster.png" alt={playlist.name} />
              <strong>{playlist.name}</strong>
              <small>Của {displayName}</small>
            </button>
          ))}
          {!publicPlaylists.length && <p className="empty-state">Bạn chưa tạo playlist công khai.</p>}
        </div>
      </section>

      <section className="profile-section">
        <h2>Đang theo dõi</h2>
        <div className="profile-card-grid">
          {followedArtists.map((artistTrack) => (
            <article className="profile-card artist" key={`followed-${artistTrack.artistName}`}>
              <img src={artistTrack.coverUrl || '/assets/covers/poster.png'} alt={artistTrack.artistName} />
              <strong>{artistTrack.artistName}</strong>
              <small>Nghệ sĩ</small>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}

