import {
  Check,
  Expand,
  Grid2X2,
  Heart,
  LayoutGrid,
  Library,
  List,
  ListMusic,
  Music,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Search,
  X,
} from 'lucide-react';
import type { Playlist } from '../stores/libraryStore';
import type { View } from '../types';

type SidebarProps = {
  activeView: View;
  isCollapsed: boolean;
  isSortOpen: boolean;
  likedCount: number;
  playlists: Playlist[];
  uploadCount: number;
  onCreatePlaylist: () => void;
  onImportLocalMusic: () => void;
  onSelectView: (view: View, playlistId?: string | null) => void;
  onToggleCollapse: () => void;
  onToggleSort: () => void;
};

export function Sidebar({
  activeView,
  isCollapsed,
  isSortOpen,
  likedCount,
  playlists,
  uploadCount,
  onCreatePlaylist,
  onImportLocalMusic,
  onSelectView,
  onToggleCollapse,
  onToggleSort,
}: SidebarProps) {
  return (
    <aside className="sidebar">
      <div className="library-panel">
        <div className="library-header">
          <button
            className="library-title"
            title={isCollapsed ? 'Mở Thư viện' : 'Thu gọn Thư viện'}
            onClick={onToggleCollapse}
          >
            {isCollapsed ? <PanelLeftOpen size={22} /> : <PanelLeftClose size={22} />}
            <span>Thư viện</span>
          </button>
          <div className="library-actions">
            <button className="create-button" onClick={onCreatePlaylist}>
              <Plus size={20} />
              <span>Tạo</span>
            </button>
            <button className="icon-button" aria-label="Expand library">
              <Expand size={18} />
            </button>
          </div>
        </div>

        <div className="library-filters">
          <button className="clear-filter" aria-label="Clear filters">
            <X size={18} />
          </button>
          <button className="active">Playlist</button>
          <button>Của bạn</button>
          <button>Nghệ sĩ</button>
        </div>

        <div className="library-search-row">
          <button className="search-library-button" aria-label="Search library">
            <Search size={18} />
          </button>
          <button className="sort-button" onClick={onToggleSort}>
            Gần đây
            <List size={18} />
          </button>

          {isSortOpen && (
            <div className="library-sort-menu">
              <strong>Sắp xếp theo</strong>
              {['Gần đây', 'Mới thêm gần đây', 'Thứ tự chữ cái', 'Người sáng tạo', 'Thứ tự tùy chỉnh'].map((item) => (
                <button className={item === 'Gần đây' ? 'selected' : ''} key={item}>
                  {item}
                  {item === 'Gần đây' && <Check size={18} />}
                </button>
              ))}
              <div className="sort-divider" />
              <strong>Xem dưới dạng</strong>
              <div className="view-mode-row">
                <button>
                  <List size={20} />
                </button>
                <button className="active">
                  <ListMusic size={20} />
                </button>
                <button>
                  <LayoutGrid size={18} />
                </button>
                <button>
                  <Grid2X2 size={18} />
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="library-list">
          <button className="library-item" onClick={() => onSelectView('Liked Tracks')}>
            <div className="library-art liked-art">
              <Heart size={24} fill="currentColor" />
            </div>
            <span>
              <strong>Bài hát đã thích</strong>
              <small>Danh sách phát • {likedCount} bài hát</small>
            </span>
          </button>

          <button className="library-item" onClick={() => onSelectView('Your Library')}>
            <div className="library-art">
              <Music size={22} />
            </div>
            <span>
              <strong>VPOP</strong>
              <small>Danh sách phát • {likedCount + uploadCount || 2} bài hát</small>
            </span>
          </button>

          <button className="library-item" onClick={onImportLocalMusic}>
            <img src="/assets/covers/poster.png" alt="" />
            <span>
              <strong>Uploads</strong>
              <small>Nhạc local • {uploadCount} bài hát</small>
            </span>
          </button>

          {playlists.map((playlist) => (
            <button className="library-item" key={playlist.id} onClick={() => onSelectView('Playlist', playlist.id)}>
              <div className="library-art">
                <Library size={22} />
              </div>
              <span>
                <strong>{playlist.name}</strong>
                <small>Danh sách phát • {playlist.trackIds.length} bài hát</small>
              </span>
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}
