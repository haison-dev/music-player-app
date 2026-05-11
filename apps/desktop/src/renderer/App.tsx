import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef, useState, type CSSProperties, type FormEvent, type PointerEvent as ReactPointerEvent } from 'react';
import type { TrackSummary } from '@music/shared';
import { AuthModal } from './components/AuthModal';
import { Hero } from './components/Hero';
import { PlayerBar } from './components/PlayerBar';
import { PlaylistModal } from './components/PlaylistModal';
import { QueuePanel } from './components/QueuePanel';
import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { TrackTable } from './components/TrackTable';
import { fallbackTracks } from './data/fallbackTracks';
import { useAudioPlayer } from './hooks/useAudioPlayer';
import { useTrackViews } from './hooks/useTrackViews';
import { getFeaturedTracks, getHealth } from './services/api';
import { useAuthStore } from './stores/authStore';
import { useLibraryStore } from './stores/libraryStore';
import type { AuthMode, View } from './types';

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
  const [notice, setNotice] = useState('Ready');
  const [isNowPlayingOpen, setNowPlayingOpen] = useState(true);
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isProfileMenuOpen, setProfileMenuOpen] = useState(false);
  const [isLibrarySortOpen, setLibrarySortOpen] = useState(false);
  const [isPlaylistMoreOpen, setPlaylistMoreOpen] = useState(false);
  const [isPlaylistViewOpen, setPlaylistViewOpen] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(300);
  const [isResizingSidebar, setResizingSidebar] = useState(false);

  const { user, login, register, logout } = useAuthStore();
  const {
    likedTrackIds,
    playlists,
    uploadedTracks,
    selectedFolder,
    toggleLike,
    createPlaylist,
    addTrackToPlaylist,
    removeTrackFromPlaylist,
    setSelectedFolder,
    addUploadedTrack,
  } = useLibraryStore();

  const health = useQuery({ queryKey: ['health'], queryFn: getHealth, retry: 1 });
  const tracksQuery = useQuery<TrackSummary[]>({
    queryKey: ['featured-tracks'],
    queryFn: getFeaturedTracks,
    retry: 1,
  });

  const apiTracks = tracksQuery.data?.length ? tracksQuery.data : fallbackTracks;
  const { activePlaylist, allTracks, visibleTracks } = useTrackViews({
    activePlaylistId,
    activeView,
    apiTracks,
    likedTrackIds,
    playlists,
    query,
    uploadedTracks,
  });
  const player = useAudioPlayer(allTracks);
  const activeTrack = player.activeTrack ?? allTracks[0];

  useEffect(() => {
    if (!isResizingSidebar) {
      return;
    }

    function resize(event: globalThis.PointerEvent) {
      const appLeft = appRef.current?.getBoundingClientRect().left ?? 0;
      const nextWidth = Math.min(520, Math.max(260, event.clientX - appLeft));
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
      setNotice('Sign in to use library features.');
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

  async function importLocalMusic() {
    const folder = await window.musicPlatform.library.selectFolder();

    if (!folder) {
      return;
    }

    setSelectedFolder(folder);
    fallbackTracks.forEach(addUploadedTrack);
    selectView('Uploads');
    setNotice('Folder selected. Demo tracks were added to Uploads until scanner is implemented.');
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

  function submitPlaylist(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    requireUser(() => {
      const playlist = createPlaylist(playlistName);

      if (pendingTrack) {
        addTrackToPlaylist(playlist.id, pendingTrack.id);
      }

      setPlaylistName('');
      closePlaylistModal();
      selectView('Playlist', playlist.id);
      setNotice(`Playlist "${playlist.name}" created.`);
    });
  }

  function addPendingTrackToPlaylist(playlistId: string) {
    if (!pendingTrack) {
      return;
    }

    addTrackToPlaylist(playlistId, pendingTrack.id);
    closePlaylistModal();
    setNotice('Track added to playlist.');
  }

  function submitAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get('email') ?? '');
    const password = String(form.get('password') ?? '');
    const displayName = String(form.get('displayName') ?? '');

    try {
      if (authMode === 'register') {
        register(displayName, email, password);
      } else {
        login(email, password);
      }

      setAuthError('');
      setAuthOpen(false);
      setNotice(authMode === 'register' ? 'Account created.' : 'Signed in.');
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

  return (
    <div
      ref={appRef}
      className={[
        'app-shell',
        isNowPlayingOpen ? '' : 'now-playing-hidden',
        isSidebarCollapsed ? 'sidebar-collapsed' : '',
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
        apiOnline={health.isSuccess}
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
          setNotice('Signed out.');
        }}
        onNotify={() => setNotice('No new notifications.')}
        onProfileMenuToggle={() => setProfileMenuOpen((current) => !current)}
        onSelectHome={() => selectView('Home')}
        onSearch={(nextQuery) => {
          setQuery(nextQuery);
          setActiveView('Search');
          setProfileMenuOpen(false);
        }}
      />

        <Sidebar
          activeView={activeView}
          isCollapsed={isSidebarCollapsed}
          isSortOpen={isLibrarySortOpen}
          likedCount={likedTrackIds.length}
          playlists={playlists}
          uploadCount={uploadedTracks.length}
          onCreatePlaylist={() => requireUser(() => setPlaylistOpen(true))}
          onImportLocalMusic={importLocalMusic}
          onSelectView={selectView}
          onToggleSort={() => setLibrarySortOpen((current) => !current)}
          onToggleCollapse={() => setSidebarCollapsed((current) => !current)}
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
        <Hero
          activePlaylist={activePlaylist}
          activeView={activeView}
          notice={notice}
          selectedFolder={selectedFolder}
          tracks={visibleTracks.length ? visibleTracks : allTracks}
          user={user}
        />
        <TrackTable
          activePlaylist={activePlaylist}
          activeTrackId={activeTrack.id}
          activeView={activeView}
          isMoreMenuOpen={isPlaylistMoreOpen}
          isViewMenuOpen={isPlaylistViewOpen}
          likedTrackIds={likedTrackIds}
          tracks={visibleTracks}
          onAddToPlaylist={openAddToPlaylist}
          onPlayTrack={player.playTrack}
          onRefresh={() => tracksQuery.refetch()}
          onRemoveFromPlaylist={removeTrackFromPlaylist}
          onShuffle={() => {
            player.toggleShuffleMode();
            setNotice(player.isShuffleOn ? 'Shuffle off.' : 'Shuffle on.');
          }}
          onToggleLike={toggleLike}
          onToggleMoreMenu={() => {
            setPlaylistMoreOpen((current) => !current);
            setPlaylistViewOpen(false);
          }}
          onToggleViewMenu={() => {
            setPlaylistViewOpen((current) => !current);
            setPlaylistMoreOpen(false);
          }}
        />
      </main>

      {isNowPlayingOpen && (
        <QueuePanel
          activeTrack={activeTrack}
          queue={player.queue}
          tracks={allTracks}
          onClose={() => setNowPlayingOpen(false)}
          onPlayTrack={player.playTrack}
        />
      )}

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
          setNotice(player.isShuffleOn ? 'Shuffle off.' : 'Shuffle on.');
        }}
        onToggleLike={() => toggleLike(activeTrack.id)}
        onTogglePlay={player.togglePlay}
      />

      {!isNowPlayingOpen && (
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
          onSubmit={submitPlaylist}
        />
      )}
    </div>
  );
}

export default App;
