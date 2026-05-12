import { Body, Controller, Delete, Get, Inject, Param, Patch, Post, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { IsOptional, IsString, MinLength } from 'class-validator';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUserId } from '../auth/current-user.decorator';
import { LibraryService } from './library.service';

type UploadedAudioFile = {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
  size: number;
};

class ToggleLikeDto {
  @IsString()
  @MinLength(1)
  trackId!: string;
}

class CreatePlaylistDto {
  @IsString()
  @MinLength(1)
  name!: string;
}

class PlaylistTrackDto {
  @IsString()
  @MinLength(1)
  trackId!: string;
}

class FolderDto {
  @IsOptional()
  @IsString()
  folder!: string | null;
}

class UploadAudioDto {
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

class ToggleFollowDto {
  @IsString()
  @MinLength(1)
  artistId!: string;
}

@Controller('library')
@UseGuards(AuthGuard)
export class LibraryController {
  constructor(@Inject(LibraryService) private readonly libraryService: LibraryService) {}

  @Get()
  getState(@CurrentUserId() userId: string) {
    return this.libraryService.getState(userId);
  }

  @Post('likes/toggle')
  toggleLike(@CurrentUserId() userId: string, @Body() body: ToggleLikeDto) {
    return this.libraryService.toggleLike(userId, body.trackId);
  }

  @Post('playlists')
  createPlaylist(@CurrentUserId() userId: string, @Body() body: CreatePlaylistDto) {
    return this.libraryService.createPlaylist(userId, body.name);
  }

  @Post('playlists/:playlistId/tracks')
  addTrack(@CurrentUserId() userId: string, @Param('playlistId') playlistId: string, @Body() body: PlaylistTrackDto) {
    return this.libraryService.addTrackToPlaylist(userId, playlistId, body.trackId);
  }

  @Delete('playlists/:playlistId/tracks/:trackId')
  removeTrack(
    @CurrentUserId() userId: string,
    @Param('playlistId') playlistId: string,
    @Param('trackId') trackId: string,
  ) {
    return this.libraryService.removeTrackFromPlaylist(userId, playlistId, trackId);
  }

  @Patch('selected-folder')
  setSelectedFolder(@CurrentUserId() userId: string, @Body() body: FolderDto) {
    return this.libraryService.setSelectedFolder(userId, body.folder ?? null);
  }

  @Post('uploads/audio')
  @UseInterceptors(FileInterceptor('audio'))
  uploadAudio(@CurrentUserId() userId: string, @Body() body: UploadAudioDto, @UploadedFile() audio: UploadedAudioFile) {
    return this.libraryService.uploadAudioFile(userId, {
      audio,
      artistName: body.artistName,
      coverUrl: body.coverUrl,
      durationSeconds: Number(body.durationSeconds),
      selectedFolder: body.selectedFolder,
      title: body.title,
    });
  }

  @Post('follows/toggle')
  toggleFollow(@CurrentUserId() userId: string, @Body() body: ToggleFollowDto) {
    return this.libraryService.toggleFollowArtist(userId, body.artistId);
  }
}
