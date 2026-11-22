import { Body, Controller, Get, HttpCode, Post, Res } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { AuthenticateUserDto } from './dto/authenticate.dto.js';
import { type Response } from 'express';
import { Public } from '../common/decorators/public.decorator.js';
import { type AuthUser, CurrentUser } from '../common/decorators/current-user.decorator.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post()
  @Public()
  @HttpCode(200)
  async authenticateUser(
    @Body() dto: AuthenticateUserDto,
    @Res({ passthrough: true }) res: Response
  ) {
    return await this.authService.authenticateUser(res, dto);
  }

  @Get('session')
  async fetchAuthSession(
    @CurrentUser() user: AuthUser
  ) {
    return user;
  }
}
