import { Controller, Get } from '@nestjs/common';
import { AssessmentService } from './assessment.service.js';
import { type AuthUser, CurrentUser } from '../common/decorators/current-user.decorator.js';

@Controller('assessment')
export class AssessmentController {
  constructor(private readonly assessmentService: AssessmentService) { }

  @Get()
  async getAssessmentTest(@CurrentUser() user: AuthUser) {
    return await this.assessmentService.getAssessmentTest(user);
  }
}
