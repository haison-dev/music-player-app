import {
  Ban,
  Check,
  ChevronRight,
  Clock3,
  Download,
  Edit3,
  ExternalLink,
  Folder,
  Heart,
  Import,
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
import { useEffect, useMemo, useRef, useState } from 'react';
import type { TrackSummary } from '@music/shared';
import type { Playlist } from '../stores/libraryStore';
import type { View } from '../types';
import { resolveAssetUrl } from '../utils/assets';
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
  onDownloadPlaylist: () => void;
  onImportLocalMusic: () => void;
  onFollowArtist: () => void;
  onMoreAction: (action: string) => void;
  onChangeListView: (mode: 'compact' | 'list') => void;
};

const moreItems = [
  { label: 'Thêm vào danh sách chờ', icon: ListMusic },
  { label: 'Xóa khỏi hồ sơ', icon: UserMinus, dividerBefore: true },
  { label: 'Sửa thông tin chi tiết', icon: Edit3 },
  { label: 'Xóa', icon: MinusCircle },
  { label: 'Đặt thành riêng tư', icon: Lock, dividerBefore: true },
  { label: 'Mời cộng sự', icon: UserPlus },
  { label: 'Loại bỏ khỏi hồ sơ sở thích của bạn', icon: Ban },
  { label: 'Di chuyển sang thư mục', icon: Folder, dividerBefore: true, hasSubmenu: true },
  { label: 'Chia sẻ', icon: Share2, hasSubmenu: true },
  { label: 'Mở trong ứng dụng dành cho máy tính', icon: ExternalLink, dividerBefore: true },
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
  onDownloadPlaylist,
  onImportLocalMusic,
  onFollowArtist,
  onMoreAction,
  onChangeListView,
}: TrackTableProps) {
  const moreButtonRef = useRef<HTMLButtonElement | null>(null);
  const moreMenuRef = useRef<HTMLDivElement | null>(null);
  const [moreMenuPos, setMoreMenuPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const moreMenuWidth = 336;

  const moreMenuStyle = useMemo(
    () => ({
      top: `${moreMenuPos.top}px`,
      left: `${moreMenuPos.left}px`,
    }),
    [moreMenuPos],
  );

  useEffect(() => {
    if (!isMoreMenuOpen) {
      return;
    }

    const updatePosition = () => {
      const rect = moreButtonRef.current?.getBoundingClientRect();
      if (!rect) {
        return;
      }

      const horizontalPadding = 8;
      const maxLeft = window.innerWidth - moreMenuWidth - horizontalPadding;
      const nextLeft = Math.max(horizontalPadding, Math.min(rect.left, maxLeft));
      const nextTop = Math.max(8, rect.top - 18);

      setMoreMenuPos({ top: nextTop, left: nextLeft });
    };

    updatePosition();
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isMoreMenuOpen]);

  useEffect(() => {
    if (!isMoreMenuOpen) {
      return;
    }

    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (moreMenuRef.current?.contains(target) || moreButtonRef.current?.contains(target)) {
        return;
      }
      onToggleMoreMenu();
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onToggleMoreMenu();
      }
    };

    window.addEventListener('mousedown', onPointerDown);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('mousedown', onPointerDown);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isMoreMenuOpen, onToggleMoreMenu]);

  return (
    <section className="table-section">
      <div className="playlist-actions">
        <button className="large-play-button" onClick={() => tracks[0] && onPlayTrack(tracks[0])}>
          ▶
        </button>
        <button className="ghost-action" onClick={onShuffle} title="Trộn bài hát">
          <Shuffle size={30} />
        </button>
        <button className="ghost-action" title="Download" onClick={onDownloadPlaylist}>
          <Download size={30} />
        </button>
        {activeView === 'Uploads' && (
          <button className="ghost-action" title="Upload local music" onClick={onImportLocalMusic}>
            <Import size={30} />
          </button>
        )}
        <button className="ghost-action" title="Follow" onClick={onFollowArtist}>
          <UserPlus size={30} />
        </button>

        <div className="playlist-menu-wrap">
          <button className="ghost-action" title="More" onClick={onToggleMoreMenu} ref={moreButtonRef}>
            <MoreHorizontal size={30} />
          </button>
          {isMoreMenuOpen && (
            <div className="playlist-more-menu fixed-layer" style={moreMenuStyle} ref={moreMenuRef}>
              {moreItems.map(({ label, icon: Icon, dividerBefore, hasSubmenu }) => (
                <button
                  className={`${dividerBefore ? 'with-divider' : ''} ${hasSubmenu ? 'has-submenu' : ''}`.trim()}
                  key={label}
                  onClick={() => onMoreAction(label)}
                >
                  <Icon size={18} />
                  <span>{label}</span>
                  {hasSubmenu && <ChevronRight size={16} />}
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
              <button className="selected" onClick={() => onChangeListView('compact')}>
                <ListMusic size={20} />
                Rút gọn
                <Check size={18} />
              </button>
              <button onClick={() => onChangeListView('list')}>
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
            <img src={resolveAssetUrl(track.coverUrl)} alt="" />
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
