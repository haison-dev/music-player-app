import { Body, Controller, Delete, Get, Inject, Param, Patch, Post, Query } from '@nestjs/common';
import { IsObject, IsOptional, IsString, MinLength } from 'class-validator';
import type { TrackSummary } from '@music/shared';
import { LibraryService } from './library.service';

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

  @Post('follows/toggle')
  toggleFollow(@Body() body: ToggleFollowDto) {
    return this.libraryService.toggleFollowArtist(body.userId, body.artistId);
  }
}
