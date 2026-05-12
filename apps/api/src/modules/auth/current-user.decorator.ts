import { createParamDecorator, ExecutionContext, UnauthorizedException } from '@nestjs/common';

type RequestWithUser = {
  authUserId?: string;
};

export const CurrentUserId = createParamDecorator((_: unknown, context: ExecutionContext) => {
  const request = context.switchToHttp().getRequest<RequestWithUser>();
  if (!request.authUserId) {
    throw new UnauthorizedException('Missing authenticated user.');
  }
  return request.authUserId;
});

