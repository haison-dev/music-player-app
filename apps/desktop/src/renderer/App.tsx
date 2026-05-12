import { useEffect, useMemo, useRef, useState, type CSSProperties, type FormEvent, type PointerEvent as ReactPointerEvent } from 'react';
import type { TrackSummary } from '@music/shared';
import { AuthModal } from './components/AuthModal';
import { Hero } from './components/Hero';
import { HomeFeed } from './components/HomeFeed';
import { PlayerBar } from './components/PlayerBar';
import { PlaylistModal } from './components/PlaylistModal';
import { QueuePanel } from './components/QueuePanel';
import { Sidebar, type LibrarySortBy, type LibraryViewMode } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { TrackTable } from './components/TrackTable';
import { UserProfile } from './components/UserProfile';
import { useAudioPlayer } from './hooks/useAudioPlayer';
import { useTrackViews } from './hooks/useTrackViews';
import {
  addTrackToPlaylistApi,
  createPlaylistApi,
  getLibraryState,
  loginAccount,
  registerAccount,
  removeTrackFromPlaylistApi,
  setSelectedFolderApi,
  toggleFollowArtistApi,
  toggleLikeTrack,
  trackUiAction,
  uploadAudioFileApi,
  type LibraryStateDto,
} from './services/api';
import { useAuthStore } from './stores/authStore';
import { useLibraryStore } from './stores/libraryStore';
import type { AuthMode, View } from './types';
import { DEFAULT_COVER_URL } from './utils/assets';

function App() {
  const appRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState('');
  const [activeView, setActiveView] = useState<View>('Home');
  const [activePlaylistId, setActivePlaylistId] = useState<string | null>(null);
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [isAuthOpen, setAuthOpen] = useState(false);
  const [isPlaylistOpen, setPlaylistOpen] = useState(false);
  const [isAddToPlaylistOpen, setAddToPlaylistOpen] = useState(false);
  const [pendingTrack, setPendingTrack] = useState<TrackSummary | null>(null);
  const [playlistName, setPlaylistName] = useState('');
  const [authError, setAuthError] = useState('');
  const [notice, setNotice] = useState('Sẵn sàng');
  const [isNowPlayingOpen, setNowPlayingOpen] = useState(true);
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isProfileMenuOpen, setProfileMenuOpen] = useState(false);
  const [isLibrarySortOpen, setLibrarySortOpen] = useState(false);
  const [librarySortBy, setLibrarySortBy] = useState<LibrarySortBy>('recent');
  const [libraryViewMode, setLibraryViewMode] = useState<LibraryViewMode>('compact');
  const [isPlaylistMoreOpen, setPlaylistMoreOpen] = useState(false);
  const [isPlaylistViewOpen, setPlaylistViewOpen] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(400);
  const [isResizingSidebar, setResizingSidebar] = useState(false);

  const { user, logout } = useAuthStore();
  const {
    likedTrackIds,
    playlists,
    uploadedTracks,
    selectedFolder,
    followedArtistIds,
  } = useLibraryStore();
  const { activePlaylist, allTracks, visibleTracks } = useTrackViews({
    activePlaylistId,
    activeView,
    likedTrackIds,
    playlists,
    query,
    uploadedTracks,
  });
  const player = useAudioPlayer(allTracks);
  const activeTrack = player.activeTrack ?? allTracks[0];
  const sortedPlaylists = useMemo(() => {
    const next = [...playlists];

    if (librarySortBy === 'alphabetical' || librarySortBy === 'creator') {
      return next.sort((a, b) => a.name.localeCompare(b.name));
    }

    if (librarySortBy === 'recent' || librarySortBy === 'recent_added') {
      return next.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return next;
  }, [librarySortBy, playlists]);

  function syncLibraryState(next: LibraryStateDto) {
    useLibraryStore.setState({
      likedTrackIds: next.likedTrackIds,
      playlists: next.playlists,
      uploadedTracks: next.uploadedTracks,
      selectedFolder: next.selectedFolder,
      followedArtistIds: next.followedArtistIds,
    });
  }

  useEffect(() => {
    if (!user) {
      return;
    }

    void getLibraryState(user.token)
      .then(syncLibraryState)
      .catch(() => {
        setNotice('Không thể tải thư viện cloud. Đang dùng dữ liệu cục bộ.');
      });
  }, [user]);

  useEffect(() => {
    if (!isResizingSidebar) {
      return;
    }

    function resize(event: globalThis.PointerEvent) {
      const appLeft = appRef.current?.getBoundingClientRect().left ?? 0;
      const nextWidth = Math.min(520, Math.max(340, event.clientX - appLeft));
      setSidebarWidth(nextWidth);
    }

    function stopResize() {
      setResizingSidebar(false);
      document.body.classList.remove('is-resizing-sidebar');
    }

    window.addEventListener('pointermove', resize);
    window.addEventListener('pointerup', stopResize);
    window.addEventListener('pointercancel', stopResize);

    return () => {
      window.removeEventListener('pointermove', resize);
      window.removeEventListener('pointerup', stopResize);
      window.removeEventListener('pointercancel', stopResize);
      document.body.classList.remove('is-resizing-sidebar');
    };
  }, [isResizingSidebar]);

  function requireUser(action: () => void) {
    if (!user) {
      setAuthMode('login');
      setAuthOpen(true);
      setNotice('Vui lòng đăng nhập để dùng tính năng thư viện.');
      return;
    }

    action();
  }

  function selectView(view: View, playlistId: string | null = null) {
    setActiveView(view);
    setActivePlaylistId(playlistId);

    if (view === 'Search') {
      window.setTimeout(() => document.querySelector<HTMLInputElement>('.search-box input')?.focus(), 0);
    }
  }

  function goHome() {
    setQuery('');
    setProfileMenuOpen(false);
    setLibrarySortOpen(false);
    setPlaylistMoreOpen(false);
    setPlaylistViewOpen(false);
    selectView('Home');
    document.querySelector<HTMLElement>('.content')?.scrollTo({ top: 0, behavior: 'smooth' });
    void trackUiAction('go-home', user?.id);
    setNotice('Đã về trang chủ.');
  }

  function openArtistFromHome(artistName: string) {
    setQuery(artistName);
    selectView('Search');
    setNotice(`Đang mở nghệ sĩ: ${artistName}`);
  }

  async function importLocalMusic() {
    const audioFiles = await window.musicPlatform.library.selectAudioFiles();

    if (!audioFiles.length) {
      return;
    }

    if (!user) {
      setAuthMode('login');
      setAuthOpen(true);
      return;
    }

    const selectedFolder = audioFiles[0]?.filePath.replace(/\\/g, '/').split('/').slice(0, -1).join('/') ?? null;
    const nextFolderState = await setSelectedFolderApi(user.token, selectedFolder);
    syncLibraryState(nextFolderState);
    for (const audioFile of audioFiles) {
      const filePath = audioFile.filePath;
      const normalizedPath = filePath.replace(/\\/g, '/');
      const fileName = normalizedPath.split('/').pop() ?? 'Unknown track';
      const stem = fileName.replace(/\.[^/.]+$/, '');
      const [artistName, title] = stem.includes(' - ')
        ? stem.split(/\s-\s(.+)/, 2)
        : ['Local Artist', stem];
      const audioBuffer = await window.musicPlatform.library.readAudioFile(filePath);
      const nextUploadState = await uploadAudioFileApi({
        audio: new Blob([audioBuffer]),
        coverUrl: audioFile.coverUrl || DEFAULT_COVER_URL,
        durationSeconds: audioFile.durationSeconds || 180,
        fileName,
        selectedFolder,
        title: audioFile.title || title || stem,
        artistName: audioFile.artistName || artistName || 'Local Artist',
        accessToken: user.token,
      });
      syncLibraryState(nextUploadState);
    }
    selectView('Uploads');
    setNotice('Đã chọn thư mục và đồng bộ bài hát.');
  }

  function openAddToPlaylist(track: TrackSummary) {
    requireUser(() => {
      setPendingTrack(track);
      setAddToPlaylistOpen(true);
    });
  }

  function closePlaylistModal() {
    setPlaylistOpen(false);
    setAddToPlaylistOpen(false);
    setPendingTrack(null);
  }

  function addPendingTrackToPlaylist(playlistId: string) {
    if (!pendingTrack) {
      return;
    }

    if (!user?.token) {
      setAuthOpen(true);
      return;
    }

    void addTrackToPlaylistApi(user.token, playlistId, pendingTrack.id).then((state) => {
      syncLibraryState(state);
      closePlaylistModal();
      setNotice('Track added to playlist.');
    });
  }

  async function submitAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get('email') ?? '');
    const password = String(form.get('password') ?? '');
    const displayName = String(form.get('displayName') ?? '');

    try {
      if (authMode === 'register') {
        const result = await registerAccount({
          email,
          password,
          username: email.split('@')[0] || 'listener',
          displayName,
        });
        useAuthStore.setState({
          user: {
            id: result.user.id,
            displayName: result.user.displayName,
            email: result.user.email,
            token: result.accessToken,
          },
        });
      } else {
        const result = await loginAccount({ email, password });
        useAuthStore.setState({
          user: {
            id: result.user.id,
            displayName: result.user.displayName,
            email: result.user.email,
            token: result.accessToken,
          },
        });
      }

      setAuthError('');
      setAuthOpen(false);
      setNotice(authMode === 'register' ? 'Tạo tài khoản thành công.' : 'Đăng nhập thành công.');
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Authentication failed.');
    }
  }

  if (!activeTrack) {
    return <div className="app-shell" />;
  }

  function startSidebarResize(event: ReactPointerEvent<HTMLDivElement>) {
    event.preventDefault();
    document.body.classList.add('is-resizing-sidebar');
    setResizingSidebar(true);
  }

  async function handleCreatePlaylist() {
    if (!user) {
      setAuthMode('login');
      setAuthOpen(true);
      return;
    }
    setPlaylistOpen(true);
  }

  async function handleSubmitPlaylist(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user?.token) {
      setAuthMode('login');
      setAuthOpen(true);
      return;
    }
    try {
      const result = await createPlaylistApi(user.token, playlistName);
      syncLibraryState(result.state);
      setPlaylistName('');
      closePlaylistModal();
      selectView('Playlist', result.playlist.id);
      setNotice(`Playlist "${result.playlist.name}" created.`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Không thể tạo playlist.');
    }
  }

  async function handleToggleLike(trackId: string) {
    if (!user?.token) {
      setAuthMode('login');
      setAuthOpen(true);
      return;
    }
    const state = await toggleLikeTrack(user.token, trackId);
    syncLibraryState(state);
  }

  async function handleRemoveFromPlaylist(playlistId: string, trackId: string) {
    if (!user?.token) {
      setAuthMode('login');
      setAuthOpen(true);
      return;
    }
    const state = await removeTrackFromPlaylistApi(user.token, playlistId, trackId);
    syncLibraryState(state);
  }

  return (
    <div
      ref={appRef}
      className={[
        'app-shell',
        isNowPlayingOpen ? '' : 'now-playing-hidden',
        isSidebarCollapsed ? 'sidebar-collapsed' : '',
        `library-mode-${libraryViewMode}`,
        isResizingSidebar ? 'resizing-sidebar' : '',
      ].join(' ')}
      style={{ '--sidebar-width': `${sidebarWidth}px` } as CSSProperties}
    >
      <audio
        ref={player.audioRef}
        onEnded={player.playNext}
        onLoadedMetadata={(event) => player.setDuration(event.currentTarget.duration)}
        onTimeUpdate={(event) => player.setCurrentTime(event.currentTarget.currentTime)}
      />

        <Topbar
        isProfileMenuOpen={isProfileMenuOpen}
        query={query}
        user={user}
        onAuthClick={() => {
          setProfileMenuOpen(false);
          setAuthOpen(true);
        }}
        onLogout={() => {
          logout();
          setProfileMenuOpen(false);
          setNotice('Đã đăng xuất.');
        }}
        onNotify={() => setNotice('Không có thông báo mới.')}
        onProfileMenuToggle={() => setProfileMenuOpen((current) => !current)}
        onSelectHome={goHome}
          onSearch={(nextQuery) => {
            setQuery(nextQuery);
            setActiveView('Search');
            setProfileMenuOpen(false);
          }}
          onOpenPremium={() => {
            void trackUiAction('open-premium', user?.id);
            setNotice('Trang Premium sẽ sớm ra mắt.');
          }}
          onInstallApp={() => {
            void trackUiAction('install-app', user?.id);
            setNotice('Ứng dụng desktop đã được cài sẵn.');
          }}
          onOpenFriends={() => {
            void trackUiAction('open-friends', user?.id);
            setNotice('Hoạt động bạn bè sẽ sớm khả dụng.');
          }}
          onProfileAction={(action) => {
            if (action === 'Hồ sơ') {
              setProfileMenuOpen(false);
              selectView('Profile');
            }
            void trackUiAction(`profile-${action}`, user?.id);
            setNotice(`Đã ghi nhận thao tác "${action}".`);
          }}
        />

        <Sidebar
          activeView={activeView}
          isCollapsed={isSidebarCollapsed}
          isSortOpen={isLibrarySortOpen}
          sortBy={librarySortBy}
          viewMode={libraryViewMode}
          likedCount={likedTrackIds.length}
          playlists={sortedPlaylists}
          uploadCount={uploadedTracks.length}
          onCreatePlaylist={() => {
            void handleCreatePlaylist();
          }}
          onImportLocalMusic={importLocalMusic}
          onSelectView={selectView}
          onToggleSort={() => setLibrarySortOpen((current) => !current)}
          onToggleCollapse={() => setSidebarCollapsed((current) => !current)}
          onSelectSort={(sortBy) => {
            setLibrarySortBy(sortBy);
            setLibrarySortOpen(false);
            void trackUiAction(`sidebar-sort-${sortBy}`, user?.id);
            setNotice(`Đã sắp xếp theo ${sortBy.replace('_', ' ')}.`);
          }}
          onSelectViewMode={(mode) => {
            setLibraryViewMode(mode);
            setLibrarySortOpen(false);
            void trackUiAction(`sidebar-view-${mode}`, user?.id);
            setNotice(`Chế độ hiển thị: ${mode.replace('_', ' ')}.`);
          }}
          onClearFilters={() => {
            setLibrarySortBy('recent');
            setLibrarySortOpen(false);
            void trackUiAction('sidebar-clear-filters', user?.id);
            setNotice('Đã xóa bộ lọc thư viện.');
          }}
          onSearchLibrary={() => {
            selectView('Search');
            void trackUiAction('sidebar-search-library', user?.id);
            setNotice('Đã chuyển sang tìm kiếm thư viện.');
          }}
          onExpandLibrary={() => {
            void trackUiAction('sidebar-expand-library', user?.id);
            setNotice('Đã thực hiện mở rộng thư viện.');
          }}
          onFilterPlaylists={() => {
            void trackUiAction('sidebar-filter-playlists', user?.id);
            setNotice('Đang hiển thị playlist.');
          }}
          onFilterArtists={() => {
            void trackUiAction('sidebar-filter-artists', user?.id);
            setNotice('Bộ lọc nghệ sĩ sẽ sớm khả dụng.');
          }}
        />

      {!isSidebarCollapsed && (
        <div
          className="sidebar-resizer"
          role="separator"
          aria-label="Resize library sidebar"
          aria-orientation="vertical"
          onPointerDown={startSidebarResize}
        />
      )}

      <main className="content">
        {activeView === 'Home' ? (
          <HomeFeed
            tracks={allTracks}
            onPlayTrack={player.playTrack}
            onOpenArtist={openArtistFromHome}
            onOpenLibraryView={() => selectView('Your Library')}
          />
        ) : activeView === 'Profile' ? (
          <UserProfile
            user={user}
            tracks={allTracks}
            playlists={playlists}
            likedTrackIds={likedTrackIds}
            followedArtistIds={followedArtistIds}
            onPlayTrack={player.playTrack}
            onOpenPlaylist={(playlistId) => selectView('Playlist', playlistId)}
          />
        ) : (
          <>
            <Hero
              activePlaylist={activePlaylist}
              activeView={activeView}
              notice={notice}
              selectedFolder={selectedFolder}
              tracks={visibleTracks}
              user={user}
            />
            <TrackTable
              activePlaylist={activePlaylist}
              activeTrackId={activeTrack?.id ?? ''}
              activeView={activeView}
              isMoreMenuOpen={isPlaylistMoreOpen}
              isViewMenuOpen={isPlaylistViewOpen}
              likedTrackIds={likedTrackIds}
              tracks={visibleTracks}
              onAddToPlaylist={openAddToPlaylist}
              onPlayTrack={player.playTrack}
              onRemoveFromPlaylist={handleRemoveFromPlaylist}
              onShuffle={() => {
                player.toggleShuffleMode();
                setNotice(player.isShuffleOn ? 'Đã tắt trộn bài.' : 'Đã bật trộn bài.');
              }}
              onToggleLike={(trackId) => {
                void handleToggleLike(trackId);
              }}
              onToggleMoreMenu={() => {
                setPlaylistMoreOpen((current) => !current);
                setPlaylistViewOpen(false);
              }}
              onToggleViewMenu={() => {
                setPlaylistViewOpen((current) => !current);
                setPlaylistMoreOpen(false);
              }}
              onDownloadPlaylist={() => {
                void trackUiAction('download-playlist', user?.id, activeView);
                setNotice('Đang chuẩn bị tải playlist.');
              }}
              onImportLocalMusic={importLocalMusic}
              onFollowArtist={() => {
                if (!user?.token) {
                  setAuthOpen(true);
                  return;
                }
                if (!activeTrack) {
                  setNotice('Chua co bai hat nao de theo doi nghe si.');
                  return;
                }
                const artistId = activeTrack.artistName.toLowerCase().replace(/\s+/g, '-');
                void toggleFollowArtistApi(user.token, artistId).then((payload) => {
                  syncLibraryState(payload.state);
                  setNotice(payload.followed ? 'Đã theo dõi nghệ sĩ.' : 'Đã bỏ theo dõi nghệ sĩ.');
                });
              }}
              onMoreAction={(action) => {
                void trackUiAction(`playlist-${action}`, user?.id, activeView);
                setNotice(`Thao tác playlist: ${action}`);
              }}
              onChangeListView={(mode) => {
                void trackUiAction(`change-view-${mode}`, user?.id, activeView);
                setNotice(`Đã chuyển chế độ xem sang ${mode}.`);
              }}
            />
          </>
        )}
      </main>

      {isNowPlayingOpen && activeTrack && (
        <QueuePanel
          activeTrack={activeTrack}
          queue={player.queue}
          tracks={allTracks}
          onClose={() => setNowPlayingOpen(false)}
          onPlayTrack={player.playTrack}
        />
      )}

      {activeTrack && (
      <PlayerBar
        activeDuration={player.activeDuration}
        activeTrack={activeTrack}
        currentTime={player.currentTime}
        isLiked={likedTrackIds.includes(activeTrack.id)}
        isPlaying={player.isPlaying}
        isShuffleOn={player.isShuffleOn}
        progressPercent={player.progressPercent}
        volume={player.volume}
        onNext={player.playNext}
        onPrevious={player.playPrevious}
        onSeek={player.seek}
        onSetVolume={player.setVolume}
        onShuffle={() => {
          player.toggleShuffleMode();
          setNotice(player.isShuffleOn ? 'Đã tắt trộn bài.' : 'Đã bật trộn bài.');
        }}
        onToggleLike={() => {
          void handleToggleLike(activeTrack.id);
        }}
        onTogglePlay={player.togglePlay}
      />
      )}

      {!isNowPlayingOpen && activeTrack && (
        <button className="now-playing-toggle" onClick={() => setNowPlayingOpen(true)}>
          Show now playing
        </button>
      )}

      {isAuthOpen && (
        <AuthModal
          authError={authError}
          authMode={authMode}
          onClose={() => setAuthOpen(false)}
          onModeChange={(nextMode) => {
            setAuthMode(nextMode);
            setAuthError('');
          }}
          onSubmit={submitAuth}
        />
      )}

      {(isPlaylistOpen || isAddToPlaylistOpen) && (
        <PlaylistModal
          pendingTrack={pendingTrack}
          playlistName={playlistName}
          playlists={playlists}
          onAddToPlaylist={addPendingTrackToPlaylist}
          onClose={closePlaylistModal}
          onPlaylistNameChange={setPlaylistName}
          onSubmit={handleSubmitPlaylist}
        />
      )}
    </div>
  );
}

export default App;
