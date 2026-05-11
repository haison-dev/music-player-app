import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ActionsModule } from './actions/actions.module';
import { AuthModule } from './auth/auth.module';
import { HealthModule } from './health/health.module';
import { LibraryModule } from './library/library.module';
import { PrismaModule } from './prisma/prisma.module';
import { TracksModule } from './tracks/tracks.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
    }),
    PrismaModule,
    HealthModule,
    AuthModule,
    LibraryModule,
    ActionsModule,
    TracksModule,
  ],
})
export class AppModule {}
