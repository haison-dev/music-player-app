import { Body, Controller, Post } from '@nestjs/common';
import { IsOptional, IsString, MinLength } from 'class-validator';

class TrackActionDto {
  @IsString()
  @MinLength(1)
  action!: string;

  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsString()
  context?: string;
}

@Controller('actions')
export class ActionsController {
  @Post('track')
  track(@Body() body: TrackActionDto) {
    return {
      ok: true,
      action: body.action,
      userId: body.userId ?? null,
      context: body.context ?? null,
      at: new Date().toISOString(),
    };
  }
}

