import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { randomBytes, timingSafeEqual, pbkdf2Sync } from 'node:crypto';
import type { User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async register(input: { email: string; username: string; displayName?: string; password: string }) {
    const email = input.email.trim().toLowerCase();
    const username = input.username.trim();

    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { username: { equals: username, mode: 'insensitive' } },
        ],
      },
      select: { email: true, username: true },
    });

    if (existingUser?.email === email) {
      throw new BadRequestException('Email is already registered.');
    }

    if (existingUser) {
      throw new BadRequestException('Username is already taken.');
    }

    const user = await this.prisma.user.create({
      data: {
        email,
        username,
        displayName: input.displayName?.trim() || username,
        passwordHash: this.hashPassword(input.password),
      },
    });

    return {
      user: this.toPublicUser(user),
      message: 'Registered successfully.',
    };
  }

  async login(input: { email: string; password: string }) {
    const email = input.email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user || !this.verifyPassword(input.password, user.passwordHash)) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    return {
      user: this.toPublicUser(user),
      message: 'Logged in successfully.',
    };
  }

  private hashPassword(password: string) {
    const salt = randomBytes(16).toString('hex');
    const hash = pbkdf2Sync(password, salt, 120000, 32, 'sha256').toString('hex');
    return `pbkdf2_sha256$120000$${salt}$${hash}`;
  }

  private verifyPassword(password: string, passwordHash: string) {
    const [algorithm, iterationsText, salt, storedHash] = passwordHash.split('$');

    if (algorithm !== 'pbkdf2_sha256' || !iterationsText || !salt || !storedHash) {
      return false;
    }

    const iterations = Number(iterationsText);
    const hash = pbkdf2Sync(password, salt, iterations, 32, 'sha256');
    const expected = Buffer.from(storedHash, 'hex');

    return expected.length === hash.length && timingSafeEqual(expected, hash);
  }

  private toPublicUser(user: User) {
    return {
      id: user.id,
      email: user.email,
      username: user.username,
      displayName: user.displayName,
    };
  }
}
