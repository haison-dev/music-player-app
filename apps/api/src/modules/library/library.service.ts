import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { TrackSummary } from '@music/shared';
import type { Playlist, Track } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

type PlaylistDto = {
  id: string;
  name: string;
  trackIds: string[];
  createdAt: string;
};

type LibraryStateDto = {
  likedTrackIds: string[];
  playlists: PlaylistDto[];
  uploadedTracks: TrackSummary[];
  selectedFolder: string | null;
  followedArtistIds: string[];
};

@Injectable()
export class LibraryService {
  constructor(private readonly prisma: PrismaService) {}

  async getState(userId: string): Promise<LibraryStateDto> {
    await this.assertUser(userId);

    const [likes, playlists, uploadedTracks, libraryState, artistFollows] = await Promise.all([
      this.prisma.trackLike.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        select: { trackId: true },
      }),
      this.prisma.playlist.findMany({
        where: { ownerId: userId },
        orderBy: { createdAt: 'desc' },
        include: { tracks: { orderBy: { position: 'asc' }, select: { trackId: true } } },
      }),
      this.prisma.track.findMany({
        where: { ownerId: userId },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.userLibraryState.findUnique({ where: { userId } }),
      this.prisma.artistFollow.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        select: { artistId: true },
      }),
    ]);

    return {
      likedTrackIds: likes.map((like) => like.trackId),
      playlists: playlists.map((playlist) => this.toPlaylistDto(playlist)),
      uploadedTracks: uploadedTracks.map((track) => this.toTrackSummary(track)),
      selectedFolder: libraryState?.selectedFolder ?? null,
      followedArtistIds: artistFollows.map((follow) => follow.artistId),
    };
  }

  async toggleLike(userId: string, trackId: string) {
    this.assertNonEmpty('trackId', trackId);
    await this.assertUser(userId);

    const existing = await this.prisma.trackLike.findUnique({
      where: { userId_trackId: { userId, trackId } },
    });

    if (existing) {
      await this.prisma.trackLike.delete({ where: { userId_trackId: { userId, trackId } } });
    } else {
      await this.prisma.trackLike.create({ data: { userId, trackId } });
    }

    return this.getState(userId);
  }

  async createPlaylist(userId: string, name: string) {
    await this.assertUser(userId);
    this.assertNonEmpty('name', name);
    const normalizedName = name.trim();

    const playlist = await this.prisma.playlist.create({
      data: {
        title: normalizedName,
        ownerId: userId,
      },
    });

    return {
      playlist: this.toPlaylistDto({ ...playlist, tracks: [] }),
      state: await this.getState(userId),
    };
  }

  async addTrackToPlaylist(userId: string, playlistId: string, trackId: string) {
    this.assertNonEmpty('playlistId', playlistId);
    this.assertNonEmpty('trackId', trackId);
    await this.assertPlaylistOwner(userId, playlistId);

    const lastTrack = await this.prisma.playlistTrack.findFirst({
      where: { playlistId },
      orderBy: { position: 'desc' },
      select: { position: true },
    });

    await this.prisma.playlistTrack.upsert({
      where: { playlistId_trackId: { playlistId, trackId } },
      update: {},
      create: {
        playlistId,
        trackId,
        position: (lastTrack?.position ?? -1) + 1,
      },
    });

    return this.getState(userId);
  }

  async removeTrackFromPlaylist(userId: string, playlistId: string, trackId: string) {
    this.assertNonEmpty('playlistId', playlistId);
    this.assertNonEmpty('trackId', trackId);
    await this.assertPlaylistOwner(userId, playlistId);

    await this.prisma.playlistTrack.deleteMany({
      where: { playlistId, trackId },
    });

    return this.getState(userId);
  }

  async setSelectedFolder(userId: string, folder: string | null) {
    await this.assertUser(userId);

    await this.prisma.userLibraryState.upsert({
      where: { userId },
      update: { selectedFolder: folder },
      create: { userId, selectedFolder: folder },
    });

    return this.getState(userId);
  }

  async upsertUploadedTrack(userId: string, track: TrackSummary) {
    await this.assertUser(userId);

    if (!track || !track.id || !track.title || !track.artistName || !track.audioUrl) {
      throw new BadRequestException('track payload is invalid.');
    }

    await this.prisma.track.upsert({
      where: { id: track.id },
      update: {
        title: track.title,
        description: track.artistName,
        durationSeconds: track.durationSeconds,
        audioObjectKey: track.audioUrl,
        coverObjectKey: track.coverUrl,
      },
      create: {
        id: track.id,
        title: track.title,
        slug: this.slugForTrack(track),
        description: track.artistName,
        durationSeconds: track.durationSeconds,
        visibility: 'PRIVATE',
        audioObjectKey: track.audioUrl,
        coverObjectKey: track.coverUrl,
        ownerId: userId,
      },
    });

    return this.getState(userId);
  }

  async toggleFollowArtist(userId: string, artistId: string) {
    this.assertNonEmpty('artistId', artistId);
    await this.assertUser(userId);

    const existing = await this.prisma.artistFollow.findUnique({
      where: { userId_artistId: { userId, artistId } },
    });

    if (existing) {
      await this.prisma.artistFollow.delete({ where: { userId_artistId: { userId, artistId } } });
    } else {
      await this.prisma.artistFollow.create({ data: { userId, artistId } });
    }

    return { followed: !existing, state: await this.getState(userId) };
  }

  private async assertUser(userId: string) {
    this.assertNonEmpty('userId', userId);
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) {
      throw new NotFoundException('User was not found.');
    }
  }

  private async assertPlaylistOwner(userId: string, playlistId: string) {
    await this.assertUser(userId);
    const playlist = await this.prisma.playlist.findFirst({
      where: { id: playlistId, ownerId: userId },
      select: { id: true },
    });

    if (!playlist) {
      throw new NotFoundException('Playlist was not found.');
    }
  }

  private toPlaylistDto(playlist: Playlist & { tracks: Array<{ trackId: string }> }): PlaylistDto {
    return {
      id: playlist.id,
      name: playlist.title,
      trackIds: playlist.tracks.map((track) => track.trackId),
      createdAt: playlist.createdAt.toISOString(),
    };
  }

  private toTrackSummary(track: Track): TrackSummary {
    return {
      id: track.id,
      title: track.title,
      artistName: track.description || 'Local Artist',
      coverUrl: track.coverObjectKey,
      audioUrl: track.audioObjectKey,
      durationSeconds: track.durationSeconds,
    };
  }

  private slugForTrack(track: TrackSummary) {
    const normalizedTitle = track.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    const normalizedId = track.id
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(-16);
    return `${normalizedTitle || 'track'}-${normalizedId || Date.now()}`;
  }

  private assertNonEmpty(field: string, value: string) {
    if (typeof value !== 'string' || !value.trim()) {
      throw new BadRequestException(`${field} is required.`);
    }
  }
}
