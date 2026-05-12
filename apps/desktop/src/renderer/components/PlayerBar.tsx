import { Heart, Pause, Play, Shuffle, SkipBack, SkipForward, Volume2 } from 'lucide-react';
import type { CSSProperties } from 'react';
import type { TrackSummary } from '@music/shared';
import { resolveAssetUrl } from '../utils/assets';
import { formatDuration } from '../utils/formatDuration';

type PlayerBarProps = {
  activeDuration: number;
  activeTrack: TrackSummary;
  currentTime: number;
  isLiked: boolean;
  isPlaying: boolean;
  isShuffleOn: boolean;
  progressPercent: number;
  volume: number;
  onNext: () => void;
  onPrevious: () => void;
  onSeek: (value: string) => void;
  onSetVolume: (volume: number) => void;
  onShuffle: () => void;
  onToggleLike: () => void;
  onTogglePlay: () => void;
};

export function PlayerBar({
  activeDuration,
  activeTrack,
  currentTime,
  isLiked,
  isPlaying,
  isShuffleOn,
  progressPercent,
  volume,
  onNext,
  onPrevious,
  onSeek,
  onSetVolume,
  onShuffle,
  onToggleLike,
  onTogglePlay,
}: PlayerBarProps) {
  return (
    <footer className="player-bar">
      <div className="current-track">
        <img src={resolveAssetUrl(activeTrack.coverUrl)} alt="" />
        <div>
          <strong>{activeTrack.title}</strong>
          <span>{activeTrack.artistName}</span>
        </div>
        <button className={`icon-button ${isLiked ? 'liked' : ''}`} aria-label="Like track" onClick={onToggleLike}>
          <Heart size={18} fill={isLiked ? 'currentColor' : 'none'} />
        </button>
      </div>

      <div className="player-controls">
        <div className="transport">
          <button className={`icon-button ${isShuffleOn ? 'active-control' : ''}`} aria-label="Shuffle" onClick={onShuffle}>
            <Shuffle size={18} />
          </button>
          <button className="icon-button" aria-label="Previous" onClick={onPrevious}>
            <SkipBack size={20} />
          </button>
          <button className="play-button" aria-label="Play" onClick={onTogglePlay}>
            {isPlaying ? <Pause size={22} fill="currentColor" /> : <Play size={22} fill="currentColor" />}
          </button>
          <button className="icon-button" aria-label="Next" onClick={onNext}>
            <SkipForward size={20} />
          </button>
        </div>
        <div className="progress-line">
          <span>{formatDuration(currentTime)}</span>
          <input
            aria-label="Track progress"
            max={Math.floor(activeDuration)}
            min="0"
            onChange={(event) => onSeek(event.target.value)}
            step="1"
            style={{ '--progress': `${progressPercent}%` } as CSSProperties}
            type="range"
            value={Math.floor(currentTime)}
          />
          <span>{formatDuration(activeDuration)}</span>
        </div>
      </div>

      <div className="volume">
        <Volume2 size={18} />
        <input
          aria-label="Volume"
          max="1"
          min="0"
          onChange={(event) => onSetVolume(Number(event.target.value))}
          step="0.01"
          style={{ '--progress': `${volume * 100}%` } as CSSProperties}
          type="range"
          value={volume}
        />
      </div>
    </footer>
  );
}
