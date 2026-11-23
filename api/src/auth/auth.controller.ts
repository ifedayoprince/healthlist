import { Body, Controller, Get, HttpCode, InternalServerErrorException, Post, Res } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { type Response } from 'express';
import { Public } from '../common/decorators/public.decorator.js';
import { type AuthUser, CurrentUser } from '../common/decorators/current-user.decorator.js';
import db from '../common/db/index.js';
import { authSessions } from '../common/db/schema.js';
import { eq } from 'drizzle-orm';
import logger from '../common/logger.js';
import { SigninUserDto } from './dto/sign-in.dto.js';
import { SignupUserDto } from './dto/sign-up.dto.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('signin')
  @Public()
  @HttpCode(200)
  async signinUser(
    @Body() dto: SigninUserDto,
    @Res({ passthrough: true }) res: Response
  ) {
    return await this.authService.signinUser(res, dto);
  }

  @Post('signup')
  @Public()
  @HttpCode(200)
  async signupUser(
    @Body() dto: SignupUserDto,
    @Res({ passthrough: true }) res: Response
  ) {
    return await this.authService.signupUser(res, dto);
  }

  @Post('logout')
  @HttpCode(200)
  async logoutUser(
    @CurrentUser() user: AuthUser,
    @Res({ passthrough: true }) res: Response
  ) {
    try {
      await db.transaction(async (tx) => {
        await tx.delete(authSessions).where(eq(authSessions.userId, user.id));
        res.clearCookie('sid', {
          httpOnly: true,
          sameSite: 'lax',
          path: '/'
        });
      });
      return { success: 'OK' }
    } catch (e) {
      logger.error({
        message: 'Error while logging the user out',
        userId: user.id,
        errorMessage: (e as Error)?.message,
        errorStack: (e as Error)?.stack,
      });
      throw new InternalServerErrorException(`There was an error logging you out. Please try again`)
    }

  }

  @Get('session')
  @HttpCode(200)
  async fetchAuthSession(
    @CurrentUser() user: AuthUser
  ) {
    return user;
  }
}
