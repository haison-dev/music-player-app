import { Injectable } from '@nestjs/common';
import type { TrackSummary } from '@music/shared';

@Injectable()
export class TracksService {
  async getFeatured(): Promise<TrackSummary[]> {
    return [];
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

