import { Body, Controller, Get, HttpCode, Post } from '@nestjs/common';
import { AssessmentService } from './assessment.service.js';
import { type AuthUser, CurrentUser } from '../common/decorators/current-user.decorator.js';
import { SubmitOrUpdateAnswerDto } from './dto/submit-or-update-answer.dto.js';

@Controller('assessment')
export class AssessmentController {
  constructor(private readonly assessmentService: AssessmentService) { }

  @Get()
  @HttpCode(200)
  async getAssessmentTest(@CurrentUser() user: AuthUser) {
    return await this.assessmentService.getAssessmentTest(user);
  }

  @Post('submit_answer')
  @HttpCode(200)
  async submitAnswer(
    @CurrentUser() user: AuthUser,
    @Body() dto: SubmitOrUpdateAnswerDto
  ) {
    return await this.assessmentService.submitAnswer(user, dto);
  }

  @Post('update_answer')
  @HttpCode(200)
  async updateAnswer(
    @CurrentUser() user: AuthUser,
    @Body() dto: SubmitOrUpdateAnswerDto
  ) {
    return await this.assessmentService.updateAnswer(user, dto);
  }
}
