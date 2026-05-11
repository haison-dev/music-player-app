import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';

type AuthUserRecord = {
  id: string;
  email: string;
  username: string;
  displayName: string;
  password: string;
};

@Injectable()
export class AuthService {
  private readonly usersByEmail = new Map<string, AuthUserRecord>();

  register(input: { email: string; username: string; displayName?: string; password: string }) {
    const email = input.email.trim().toLowerCase();
    const username = input.username.trim();

    if (this.usersByEmail.has(email)) {
      throw new BadRequestException('Email is already registered.');
    }

    if ([...this.usersByEmail.values()].some((user) => user.username.toLowerCase() === username.toLowerCase())) {
      throw new BadRequestException('Username is already taken.');
    }

    const user: AuthUserRecord = {
      id: `user-${Date.now()}`,
      email,
      username,
      displayName: input.displayName?.trim() || username,
      password: input.password,
    };

    this.usersByEmail.set(email, user);

    return {
      user: this.toPublicUser(user),
      message: 'Registered successfully.',
    };
  }

  login(input: { email: string; password: string }) {
    const email = input.email.trim().toLowerCase();
    const user = this.usersByEmail.get(email);

    if (!user || user.password !== input.password) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    return {
      user: this.toPublicUser(user),
      message: 'Logged in successfully.',
    };
  }

  private toPublicUser(user: AuthUserRecord) {
    return {
      id: user.id,
      email: user.email,
      username: user.username,
      displayName: user.displayName,
    };
  }
}

