import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthTokenService } from './auth-token.service';

type RequestWithUser = {
  headers?: Record<string, string | string[] | undefined>;
  authUserId?: string;
};

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly tokenService: AuthTokenService) {}

  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const rawHeader = request.headers?.authorization;
    const headerValue = Array.isArray(rawHeader) ? rawHeader[0] : rawHeader;
    if (!headerValue || !headerValue.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing bearer token.');
    }

    const token = headerValue.slice('Bearer '.length).trim();
    const payload = this.tokenService.verify(token);
    request.authUserId = payload.sub;
    return true;
  }
}

