import { Bell, Download, ExternalLink, Home, Megaphone, Search, User, Users } from 'lucide-react';
import type { AuthUser } from '../stores/authStore';

type TopbarProps = {
  isProfileMenuOpen: boolean;
  query: string;
  user: AuthUser | null;
  onAuthClick: () => void;
  onLogout: () => void;
  onNotify: () => void;
  onProfileMenuToggle: () => void;
  onSearch: (query: string) => void;
  onSelectHome: () => void;
  onOpenPremium: () => void;
  onInstallApp: () => void;
  onOpenFriends: () => void;
  onProfileAction: (action: string) => void;
};

const externalItems = ['Tài khoản', 'Nâng cấp lên Premium', 'Hỗ trợ', 'Tải xuống'];

export function Topbar({
  isProfileMenuOpen,
  query,
  user,
  onAuthClick,
  onLogout,
  onNotify,
  onProfileMenuToggle,
  onSearch,
  onSelectHome,
  onOpenPremium,
  onInstallApp,
  onOpenFriends,
  onProfileAction,
}: TopbarProps) {
  return (
    <header className="topbar">
      <button className="spotify-logo" aria-label="Trang chủ" onClick={onSelectHome} type="button">
        <span>≋</span>
      </button>
      <button className="top-home" onClick={onSelectHome} aria-label="Home" type="button">
        <Home size={24} />
      </button>
      <div className="search-box">
        <Search size={18} />
        <input placeholder="Bạn muốn phát nội dung gì?" value={query} onChange={(event) => onSearch(event.target.value)} />
      </div>
      <button className="premium-button" onClick={onOpenPremium}>
        Khám phá Premium
      </button>
      <button className="install-button" onClick={onInstallApp}>
        <Download size={16} />
        <span>Cài đặt Ứng dụng</span>
      </button>
      <button className="icon-button" aria-label="Friends" onClick={onOpenFriends}>
        <Users size={18} />
      </button>
      <button className="icon-button" aria-label="Notifications" onClick={onNotify}>
        <Bell size={18} />
      </button>
      <div className="profile-menu-wrap">
        <button className="status-pill user-pill" onClick={user ? onProfileMenuToggle : onAuthClick}>
          {user ? user.displayName.slice(0, 1).toUpperCase() : <User size={16} />}
        </button>

        {user && isProfileMenuOpen && (
          <div className="profile-menu">
            {externalItems.slice(0, 1).map((label) => (
              <button key={label} onClick={() => onProfileAction(label)}>
                {label}
                <ExternalLink size={18} />
              </button>
            ))}
            <button onClick={() => onProfileAction('Hồ sơ')}>Hồ sơ</button>
            <button onClick={() => onProfileAction('Gần đây')}>Gần đây</button>
            {externalItems.slice(1).map((label) => (
              <button key={label} onClick={() => onProfileAction(label)}>
                {label}
                <ExternalLink size={18} />
              </button>
            ))}
            <button onClick={() => onProfileAction('Cài đặt')}>Cài đặt</button>
            <button onClick={onLogout}>Đăng xuất</button>
            <div className="profile-update">
              <strong>Tin cập nhật</strong>
              <div>
                <span className="profile-update-icon">
                  <Megaphone size={28} />
                </span>
                <p>
                  Chào mừng bạn đến với Tin cập nhật cho bạn. Hãy xem mục này để biết tin tức về những người bạn theo dõi,
                  danh sách phát và nhiều thông tin khác.
                  <small>8 tuần</small>
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
