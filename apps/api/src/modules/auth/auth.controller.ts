import { Body, Controller, Post } from '@nestjs/common';
import { IsEmail, IsString, MinLength } from 'class-validator';

class RegisterDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(3)
  username!: string;

  @IsString()
  @MinLength(8)
  password!: string;
}

class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  password!: string;
}

@Controller('auth')
export class AuthController {
  @Post('register')
  register(@Body() body: RegisterDto) {
    return {
      message: 'Auth module is ready. Password hashing and JWT issuing are the next step.',
      user: {
        email: body.email,
        username: body.username,
      },
    };
  }

  @Post('login')
  login(@Body() body: LoginDto) {
    return {
      message: 'Auth module is ready. Replace this stub with credential validation.',
      email: body.email,
    };
  }
}
