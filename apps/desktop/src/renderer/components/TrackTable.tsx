import {
  Ban,
  Check,
  Clock3,
  Download,
  Edit3,
  ExternalLink,
  Folder,
  Heart,
  List,
  ListMusic,
  Lock,
  MinusCircle,
  MoreHorizontal,
  Plus,
  Share2,
  Shuffle,
  UserMinus,
  UserPlus,
  X,
} from 'lucide-react';
import type { TrackSummary } from '@music/shared';
import type { Playlist } from '../stores/libraryStore';
import type { View } from '../types';
import { formatDuration } from '../utils/formatDuration';

type TrackTableProps = {
  activePlaylist: Playlist | null;
  activeTrackId: string;
  activeView: View;
  isMoreMenuOpen: boolean;
  isViewMenuOpen: boolean;
  likedTrackIds: string[];
  tracks: TrackSummary[];
  onAddToPlaylist: (track: TrackSummary) => void;
  onPlayTrack: (track: TrackSummary) => void;
  onRefresh: () => void;
  onRemoveFromPlaylist: (playlistId: string, trackId: string) => void;
  onShuffle: () => void;
  onToggleLike: (trackId: string) => void;
  onToggleMoreMenu: () => void;
  onToggleViewMenu: () => void;
};

const moreItems = [
  ['Thêm vào danh sách chờ', ListMusic],
  ['Xóa khỏi hồ sơ', UserMinus],
  ['Sửa thông tin chi tiết', Edit3],
  ['Xóa', MinusCircle],
  ['Đặt thành riêng tư', Lock],
  ['Mời cộng sự', UserPlus],
  ['Loại bỏ khỏi hồ sơ sở thích của bạn', Ban],
  ['Di chuyển sang thư mục', Folder],
  ['Chia sẻ', Share2],
  ['Mở trong ứng dụng dành cho máy tính', ExternalLink],
] as const;

export function TrackTable({
  activePlaylist,
  activeTrackId,
  activeView,
  isMoreMenuOpen,
  isViewMenuOpen,
  likedTrackIds,
  tracks,
  onAddToPlaylist,
  onPlayTrack,
  onRefresh,
  onRemoveFromPlaylist,
  onShuffle,
  onToggleLike,
  onToggleMoreMenu,
  onToggleViewMenu,
}: TrackTableProps) {
  return (
    <section className="table-section">
      <div className="playlist-actions">
        <button className="large-play-button" onClick={() => tracks[0] && onPlayTrack(tracks[0])}>
          ▶
        </button>
        <button className="ghost-action" onClick={onShuffle} title="Trộn bài hát">
          <Shuffle size={30} />
        </button>
        <button className="ghost-action" title="Download">
          <Download size={30} />
        </button>
        <button className="ghost-action" title="Follow">
          <UserPlus size={30} />
        </button>

        <div className="playlist-menu-wrap">
          <button className="ghost-action" title="More" onClick={onToggleMoreMenu}>
            <MoreHorizontal size={30} />
          </button>
          {isMoreMenuOpen && (
            <div className="playlist-more-menu">
              {moreItems.map(([label, Icon], index) => (
                <button className={index === 1 || index === 4 || index === 7 ? 'with-divider' : ''} key={label}>
                  <Icon size={20} />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="playlist-menu-wrap view-menu-anchor">
          <button className="list-view-button" onClick={onToggleViewMenu}>
            Rút gọn
            <List size={20} />
          </button>
          {isViewMenuOpen && (
            <div className="playlist-view-menu">
              <strong>Xem dưới dạng</strong>
              <button className="selected">
                <ListMusic size={20} />
                Rút gọn
                <Check size={18} />
              </button>
              <button>
                <List size={20} />
                Danh sách
              </button>
            </div>
          )}
        </div>
      </div>
      <div className="song-table">
        <div className="song-row song-header">
          <span>#</span>
          <span>Tiêu đề</span>
          <span>Album</span>
          <span>Ngày thêm</span>
          <Clock3 size={18} />
          <span />
          <span />
          <span />
        </div>
        {tracks.map((track, index) => (
          <div className={`song-row ${activeTrackId === track.id ? 'playing' : ''}`} key={track.id}>
            <button onClick={() => onPlayTrack(track)}>{index + 1}</button>
            <img src={track.coverUrl || '/assets/covers/poster.png'} alt="" />
            <button className="song-main" onClick={() => onPlayTrack(track)}>
              <strong>{track.title}</strong>
              <small>{track.artistName}</small>
            </button>
            <span className="album-name">Single</span>
            <span className="date-added">13 thg 3, 2026</span>
            <span>{formatDuration(track.durationSeconds)}</span>
            <button className="icon-button" onClick={() => onToggleLike(track.id)}>
              <Heart size={16} fill={likedTrackIds.includes(track.id) ? 'currentColor' : 'none'} />
            </button>
            <button className="icon-button" onClick={() => onAddToPlaylist(track)}>
              <Plus size={16} />
            </button>
            {activeView === 'Playlist' && activePlaylist && (
              <button className="icon-button" onClick={() => onRemoveFromPlaylist(activePlaylist.id, track.id)}>
                <X size={16} />
              </button>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
