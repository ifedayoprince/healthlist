import { Body, Controller, HttpCode, Post, Res } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { AuthenticateUserDto } from './dto/authenticate.dto.js';
import { type Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post()
  @HttpCode(200)
  async authenticateUser(
    @Body() dto: AuthenticateUserDto,
    @Res({ passthrough: true }) res: Response
  ) {
    return await this.authService.authenticateUser(res, dto);
  }
}
