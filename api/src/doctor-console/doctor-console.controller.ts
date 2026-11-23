import { Body, Controller, Get, HttpCode, Param, Post, Query } from '@nestjs/common';
import { DoctorConsoleService } from './doctor-console.service.js';
import { SubmitReviewDto } from './dto/submit-review.dto.js';
import { DoctorOnly } from '../common/decorators/doctor-only.decorator.js';

@Controller('doctor-console')
@DoctorOnly()
export class DoctorConsoleController {
  constructor(private readonly doctorConsoleService: DoctorConsoleService) { }

  @Get('intakes')
  @HttpCode(200)
  async listIntakes(
    @Query('limit') limit: string,
    @Query('cursor') cursor: string
  ) {
    return await this.doctorConsoleService.listIntakes(limit ? parseInt(limit) : 10, cursor);
  }

  @Get('intakes/:intakeId')
  @HttpCode(200)
  async getIntake(
    @Param('intakeId') intakeId: string
  ) {
    return await this.doctorConsoleService.getIntake(intakeId);
  }

  @Post('intakes/:intakeId/review')
  @HttpCode(200)
  async submitReview(
    @Param('intakeId') intakeId: string,
    @Body() dto: SubmitReviewDto
  ) {
    return await this.doctorConsoleService.submitReview(intakeId, dto);
  }

  @Get('assessment/:userId')
  @HttpCode(200)
  async getAssessment(
    @Param('userId') userId: string
  ) {
    return await this.doctorConsoleService.getAssessment(userId);
  }
}
