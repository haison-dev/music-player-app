import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { TrackSummary } from '@music/shared';
import type { Playlist, Track } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';

type UploadedAudioFile = {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
  size: number;
};

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

    const existing = await this.prisma.track.findUnique({
      where: { id: track.id },
      select: { id: true, ownerId: true },
    });

    if (existing && existing.ownerId !== userId) {
      throw new BadRequestException('track does not belong to current user.');
    }

    if (existing) {
      await this.prisma.track.update({
        where: { id: track.id },
        data: {
          title: track.title,
          description: track.artistName,
          durationSeconds: track.durationSeconds,
          audioObjectKey: track.audioUrl,
          coverObjectKey: track.coverUrl,
        },
      });
    } else {
      await this.prisma.track.create({
        data: {
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
    }

    return this.getState(userId);
  }

  async uploadAudioFile(
    userId: string,
    input: {
      audio: UploadedAudioFile;
      artistName: string;
      coverUrl?: string;
      durationSeconds: number;
      selectedFolder?: string;
      title: string;
    },
  ) {
    await this.assertUser(userId);

    if (!input.audio?.buffer?.length) {
      throw new BadRequestException('audio file is required.');
    }

    const title = input.title.trim();
    const artistName = input.artistName.trim();

    if (!title || !artistName || !Number.isFinite(input.durationSeconds)) {
      throw new BadRequestException('track metadata is invalid.');
    }

    const audioUrl = await this.uploadToStorage({
      buffer: input.audio.buffer,
      contentType: input.audio.mimetype || 'application/octet-stream',
      fileName: input.audio.originalname,
      folder: `tracks/${userId}`,
    });
    const track: TrackSummary = {
      id: `upload-${randomUUID()}`,
      title,
      artistName,
      coverUrl: input.coverUrl || null,
      audioUrl,
      durationSeconds: Math.max(1, Math.round(input.durationSeconds)),
    };

    if (input.selectedFolder !== undefined) {
      await this.prisma.userLibraryState.upsert({
        where: { userId },
        update: { selectedFolder: input.selectedFolder || null },
        create: { userId, selectedFolder: input.selectedFolder || null },
      });
    }

    await this.upsertUploadedTrack(userId, track);
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

  private async uploadToStorage(input: {
    buffer: Buffer;
    contentType: string;
    fileName: string;
    folder: string;
  }) {
    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const bucket = process.env.SUPABASE_STORAGE_BUCKET || 'tracks';

    if (!supabaseUrl || !serviceRoleKey) {
      throw new BadRequestException('Supabase Storage is not configured.');
    }

    const extension = input.fileName.includes('.') ? input.fileName.split('.').pop() : 'bin';
    const objectPath = `${input.folder}/${randomUUID()}.${extension}`;
    const uploadUrl = `${supabaseUrl.replace(/\/$/, '')}/storage/v1/object/${bucket}/${objectPath}`;
    const response = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${serviceRoleKey}`,
        'Content-Type': input.contentType,
        apikey: serviceRoleKey,
        'x-upsert': 'true',
      },
      body: new Uint8Array(input.buffer),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      throw new BadRequestException(`Could not upload audio to storage. ${detail}`.trim());
    }

    return `${supabaseUrl.replace(/\/$/, '')}/storage/v1/object/public/${bucket}/${objectPath}`;
  }

  private assertNonEmpty(field: string, value: string) {
    if (typeof value !== 'string' || !value.trim()) {
      throw new BadRequestException(`${field} is required.`);
    }
  }
}
