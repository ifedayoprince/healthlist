import { Module } from '@nestjs/common';
import { AssessmentService } from './assessment.service.js';
import { AssessmentController } from './assessment.controller.js';

@Module({
  controllers: [AssessmentController],
  providers: [AssessmentService],
})
export class AssessmentModule {}
