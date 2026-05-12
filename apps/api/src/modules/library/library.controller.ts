import { Body, Controller, Delete, Get, Inject, Param, Patch, Post, Query, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { IsObject, IsOptional, IsString, MinLength } from 'class-validator';
import type { TrackSummary } from '@music/shared';
import { LibraryService } from './library.service';

type UploadedAudioFile = {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
  size: number;
};

class UserQueryDto {
  @IsString()
  @MinLength(1)
  userId!: string;
}

class ToggleLikeDto extends UserQueryDto {
  @IsString()
  @MinLength(1)
  trackId!: string;
}

class CreatePlaylistDto extends UserQueryDto {
  @IsString()
  @MinLength(1)
  name!: string;
}

class PlaylistTrackDto extends UserQueryDto {
  @IsString()
  @MinLength(1)
  trackId!: string;
}

class FolderDto extends UserQueryDto {
  @IsOptional()
  @IsString()
  folder!: string | null;
}

class UploadTrackDto extends UserQueryDto {
  @IsObject()
  track!: TrackSummary;
}

class UploadAudioDto extends UserQueryDto {
  @IsString()
  @MinLength(1)
  title!: string;

  @IsString()
  @MinLength(1)
  artistName!: string;

  @IsString()
  @MinLength(1)
  durationSeconds!: string;

  @IsOptional()
  @IsString()
  coverUrl?: string;

  @IsOptional()
  @IsString()
  selectedFolder?: string;
}

class ToggleFollowDto extends UserQueryDto {
  @IsString()
  @MinLength(1)
  artistId!: string;
}

@Controller('library')
export class LibraryController {
  constructor(@Inject(LibraryService) private readonly libraryService: LibraryService) {}

  @Get()
  getState(@Query() query: UserQueryDto) {
    return this.libraryService.getState(query.userId);
  }

  @Post('likes/toggle')
  toggleLike(@Body() body: ToggleLikeDto) {
    return this.libraryService.toggleLike(body.userId, body.trackId);
  }

  @Post('playlists')
  createPlaylist(@Body() body: CreatePlaylistDto) {
    return this.libraryService.createPlaylist(body.userId, body.name);
  }

  @Post('playlists/:playlistId/tracks')
  addTrack(@Param('playlistId') playlistId: string, @Body() body: PlaylistTrackDto) {
    return this.libraryService.addTrackToPlaylist(body.userId, playlistId, body.trackId);
  }

  @Delete('playlists/:playlistId/tracks/:trackId')
  removeTrack(
    @Param('playlistId') playlistId: string,
    @Param('trackId') trackId: string,
    @Query() query: UserQueryDto,
  ) {
    return this.libraryService.removeTrackFromPlaylist(query.userId, playlistId, trackId);
  }

  @Patch('selected-folder')
  setSelectedFolder(@Body() body: FolderDto) {
    return this.libraryService.setSelectedFolder(body.userId, body.folder ?? null);
  }

  @Post('uploads')
  uploadTrack(@Body() body: UploadTrackDto) {
    return this.libraryService.upsertUploadedTrack(body.userId, body.track);
  }

  @Post('uploads/audio')
  @UseInterceptors(FileInterceptor('audio'))
  uploadAudio(@Body() body: UploadAudioDto, @UploadedFile() audio: UploadedAudioFile) {
    return this.libraryService.uploadAudioFile(body.userId, {
      audio,
      artistName: body.artistName,
      coverUrl: body.coverUrl,
      durationSeconds: Number(body.durationSeconds),
      selectedFolder: body.selectedFolder,
      title: body.title,
    });
  }

  @Post('follows/toggle')
  toggleFollow(@Body() body: ToggleFollowDto) {
    return this.libraryService.toggleFollowArtist(body.userId, body.artistId);
  }
}
