import {
  Check,
  Expand,
  Grid2X2,
  Heart,
  Import,
  LayoutGrid,
  Library,
  List,
  ListMusic,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Search,
  X,
} from 'lucide-react';
import type { Playlist } from '../stores/libraryStore';
import type { View } from '../types';
import { DEFAULT_COVER_URL } from '../utils/assets';

export type LibrarySortBy = 'recent' | 'recent_added' | 'alphabetical' | 'creator' | 'custom';
export type LibraryViewMode = 'compact' | 'list' | 'grid' | 'small_grid';

type SidebarProps = {
  activeView: View;
  isCollapsed: boolean;
  isSortOpen: boolean;
  sortBy: LibrarySortBy;
  viewMode: LibraryViewMode;
  likedCount: number;
  playlists: Playlist[];
  uploadCount: number;
  onCreatePlaylist: () => void;
  onImportLocalMusic: () => void;
  onSelectView: (view: View, playlistId?: string | null) => void;
  onToggleCollapse: () => void;
  onToggleSort: () => void;
  onSelectSort: (sortBy: LibrarySortBy) => void;
  onSelectViewMode: (viewMode: LibraryViewMode) => void;
  onClearFilters: () => void;
  onSearchLibrary: () => void;
  onExpandLibrary: () => void;
  onFilterPlaylists: () => void;
  onFilterArtists: () => void;
};

const sortItems: Array<{ key: LibrarySortBy; label: string }> = [
  { key: 'recent', label: 'Gần đây' },
  { key: 'recent_added', label: 'Mới thêm gần đây' },
  { key: 'alphabetical', label: 'Thứ tự chữ cái' },
  { key: 'creator', label: 'Người sáng tạo' },
  { key: 'custom', label: 'Thứ tự tùy chỉnh' },
];

export function Sidebar({
  activeView,
  isCollapsed,
  isSortOpen,
  sortBy,
  viewMode,
  likedCount,
  playlists,
  uploadCount,
  onCreatePlaylist,
  onImportLocalMusic,
  onSelectView,
  onToggleCollapse,
  onToggleSort,
  onSelectSort,
  onSelectViewMode,
  onClearFilters,
  onSearchLibrary,
  onExpandLibrary,
  onFilterPlaylists,
  onFilterArtists,
}: SidebarProps) {
  const activeSort = sortItems.find((item) => item.key === sortBy)?.label ?? 'Gần đây';

  return (
    <aside className="sidebar">
      <div className={`library-panel library-view-${viewMode}`}>
        <div className="library-header">
          <button className="library-title" title={isCollapsed ? 'Mở Thư viện' : 'Thu gọn Thư viện'} onClick={onToggleCollapse}>
            {isCollapsed ? <PanelLeftOpen size={22} /> : <PanelLeftClose size={22} />}
            <span>Thư viện</span>
          </button>
          <div className="library-actions">
            <button className="create-button" onClick={onCreatePlaylist}>
              <Plus size={20} />
              <span>Tạo</span>
            </button>
            <button className="icon-button" aria-label="Expand library" onClick={onExpandLibrary}>
              <Expand size={18} />
            </button>
          </div>
        </div>

        <div className="library-filters">
          <button className="clear-filter" aria-label="Clear filters" onClick={onClearFilters}>
            <X size={18} />
          </button>
          <button className="active" onClick={onFilterPlaylists}>
            Playlist
          </button>
          <button onClick={onFilterArtists}>Nghệ sĩ</button>
        </div>

        <div className="library-search-row">
          <button className="search-library-button" aria-label="Search library" onClick={onSearchLibrary}>
            <Search size={18} />
          </button>
          <button className="sort-button" onClick={onToggleSort}>
            {activeSort}
            <List size={18} />
          </button>

          {isSortOpen && (
            <div className="library-sort-menu">
              <strong>Sắp xếp theo</strong>
              {sortItems.map((item) => (
                <button className={item.key === sortBy ? 'selected' : ''} key={item.key} onClick={() => onSelectSort(item.key)}>
                  {item.label}
                  {item.key === sortBy && <Check size={18} />}
                </button>
              ))}
              <div className="sort-divider" />
              <strong>Xem dưới dạng</strong>
              <div className="view-mode-row">
                <button className={viewMode === 'list' ? 'active' : ''} onClick={() => onSelectViewMode('list')}>
                  <List size={20} />
                </button>
                <button className={viewMode === 'compact' ? 'active' : ''} onClick={() => onSelectViewMode('compact')}>
                  <ListMusic size={20} />
                </button>
                <button className={viewMode === 'grid' ? 'active' : ''} onClick={() => onSelectViewMode('grid')}>
                  <LayoutGrid size={18} />
                </button>
                <button className={viewMode === 'small_grid' ? 'active' : ''} onClick={() => onSelectViewMode('small_grid')}>
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

          <button className="library-item" onClick={() => onSelectView('Uploads')}>
            <img src={DEFAULT_COVER_URL} alt="" />
            <span>
              <strong>Uploads</strong>
              <small>Nhạc local • {uploadCount} bài hát</small>
            </span>
          </button>

          <button className="library-upload-button" onClick={onImportLocalMusic}>
            <Import size={16} />
            <span>Upload music</span>
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
