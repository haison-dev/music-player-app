import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, timingSafeEqual } from 'node:crypto';

type TokenPayload = {
  sub: string;
  iat: number;
  exp: number;
};

@Injectable()
export class AuthTokenService {
  constructor(private readonly configService: ConfigService) {}

  sign(userId: string) {
    const now = Math.floor(Date.now() / 1000);
    const payload: TokenPayload = {
      sub: userId,
      iat: now,
      exp: now + 60 * 60 * 24 * 7,
    };
    return this.encode(payload);
  }

  verify(token: string) {
    const [encodedPayload, encodedSignature] = token.split('.');
    if (!encodedPayload || !encodedSignature) {
      throw new UnauthorizedException('Invalid access token.');
    }

    const expectedSignature = this.signRaw(encodedPayload);
    const expectedBuffer = Buffer.from(expectedSignature);
    const receivedBuffer = Buffer.from(encodedSignature);
    if (
      expectedBuffer.length !== receivedBuffer.length ||
      !timingSafeEqual(expectedBuffer, receivedBuffer)
    ) {
      throw new UnauthorizedException('Invalid access token.');
    }

    let payload: TokenPayload;
    try {
      payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8')) as TokenPayload;
    } catch {
      throw new UnauthorizedException('Invalid access token.');
    }

    if (!payload.sub || !payload.exp || payload.exp <= Math.floor(Date.now() / 1000)) {
      throw new UnauthorizedException('Access token expired.');
    }

    return payload;
  }

  private encode(payload: TokenPayload) {
    const encodedPayload = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
    const signature = this.signRaw(encodedPayload);
    return `${encodedPayload}.${signature}`;
  }

  private signRaw(value: string) {
    const secret = this.configService.get<string>('AUTH_TOKEN_SECRET') || 'dev-only-secret';
    return createHmac('sha256', secret).update(value).digest('base64url');
  }
}

