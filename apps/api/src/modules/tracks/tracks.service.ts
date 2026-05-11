import { Injectable } from '@nestjs/common';
import type { TrackSummary } from '@music/shared';

type ItunesSong = {
  trackId: number;
  trackName: string;
  artistName: string;
  previewUrl?: string;
  artworkUrl100?: string;
  trackTimeMillis?: number;
};

type ItunesSearchResponse = {
  results?: ItunesSong[];
};

@Injectable()
export class TracksService {
  private readonly fallbackTracks: TrackSummary[] = [
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

  async getFeatured() {
    const terms = ['vpop', 'newjeans', 'jennie', 'post malone', 'olivia rodrigo', 'hieuthuhai'];
    const unique = new Map<string, TrackSummary>();

    try {
      const responses = await Promise.all(
        terms.map(async (term) => {
          const url = `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&entity=song&limit=12`;
          const response = await fetch(url);
          if (!response.ok) {
            return [] as ItunesSong[];
          }
          const payload = (await response.json()) as ItunesSearchResponse;
          return payload.results ?? [];
        }),
      );

      responses.flat().forEach((song) => {
        if (!song.previewUrl || !song.trackId || !song.trackName || !song.artistName) {
          return;
        }

        const id = `itunes-${song.trackId}`;
        if (unique.has(id)) {
          return;
        }

        unique.set(id, {
          id,
          title: song.trackName,
          artistName: song.artistName,
          coverUrl: song.artworkUrl100 ? song.artworkUrl100.replace('100x100bb', '600x600bb') : null,
          audioUrl: song.previewUrl,
          durationSeconds: Math.max(30, Math.round((song.trackTimeMillis ?? 180000) / 1000)),
        });
      });

      const onlineTracks = [...unique.values()].slice(0, 40);
      if (onlineTracks.length) {
        return onlineTracks;
      }
    } catch {
      // Fallback to local demo tracks when network is unavailable.
    }

    return this.fallbackTracks;
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

