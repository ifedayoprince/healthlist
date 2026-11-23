import { Controller, Post, Body, HttpCode, Param, Get, Query } from '@nestjs/common';
import { IntakeService } from './intake.service.js';
import { CreateIntakeSessionDto } from './dto/create-intake.dto.js';
import { AllowMCPAccess } from '../common/decorators/allow-mpc-access.decorator.js';
import { type AuthUser, CurrentUser } from '../common/decorators/current-user.decorator.js';
import { SubmitIntakeSessionDto } from './dto/submit-intake.dto.js';

@Controller('intake')
export class IntakeController {
  constructor(private readonly intakeService: IntakeService) { }

  @Get()
  @HttpCode(200)
  async getIntakes(
    @CurrentUser() user: AuthUser,
    @Query('limit') limit: string,
    @Query('cursor') cursor: string
  ) {
    return await this.intakeService.getIntakes(user, limit ? parseInt(limit) : 10, cursor);
  }

  @Post()
  @AllowMCPAccess()
  @HttpCode(200)
  async create(@Body() createIntakeDto: CreateIntakeSessionDto) {
    return await this.intakeService.create(createIntakeDto);
  }

  @Get(':key')
  @HttpCode(200)
  async getIntakeSession(
    @CurrentUser() user: AuthUser,
    @Param('key') key: string
  ) {
    return await this.intakeService.getIntakeSession(user, key);
  }

  @Post('submit')
  async submitListing(
    @CurrentUser() user: AuthUser,
    @Body() dto: SubmitIntakeSessionDto
  ) {
    return await this.intakeService.submitIntakeSession(user, dto);
  }
}
