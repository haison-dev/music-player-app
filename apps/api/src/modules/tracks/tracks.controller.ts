import { Body, Controller, Get, Post } from '@nestjs/common';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';
import { TracksService } from './tracks.service';

class CreateTrackDto {
  @IsString()
  title!: string;

  @IsString()
  artistName!: string;

  @IsOptional()
  @IsString()
  coverUrl?: string;

  @IsInt()
  @Min(1)
  durationSeconds!: number;
}

@Controller('tracks')
export class TracksController {
  constructor(private readonly tracksService: TracksService) {}

  @Get('featured')
  featured() {
    return this.tracksService.getFeatured();
  }

  @Post()
  create(@Body() body: CreateTrackDto) {
    return this.tracksService.createDraft(body);
  }
}
