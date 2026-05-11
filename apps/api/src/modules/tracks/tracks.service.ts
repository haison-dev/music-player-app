import { Injectable } from '@nestjs/common';
import type { TrackSummary } from '@music/shared';

@Injectable()
export class TracksService {
  private readonly featuredTracks: TrackSummary[] = [
    {
      id: 'seed-like-jennie',
      title: 'like Jennie',
      artistName: 'Jennie',
      coverUrl: '/assets/covers/jennie-cover.jpg',
      audioUrl: '/assets/songs/like-JENNIE.mp3',
      durationSeconds: 162,
    },
    {
      id: 'seed-eta',
      title: 'ETA',
      artistName: 'NewJeans',
      coverUrl: '/assets/covers/newjeanz.jpg',
      audioUrl: '/assets/songs/ETA-NEWJEANS.mp3',
      durationSeconds: 153,
    },
  ];

  getFeatured() {
    return this.featuredTracks;
  }

  createDraft(track: Omit<TrackSummary, 'id' | 'audioUrl' | 'coverUrl'> & { coverUrl?: string }) {
    return {
      id: `draft-${Date.now()}`,
      ...track,
      audioUrl: null,
      coverUrl: track.coverUrl ?? null,
    };
  }
}
