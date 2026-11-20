import { Module } from '@nestjs/common';
import { IntakeService } from './intake.service.js';
import { IntakeController } from './intake.controller.js';

@Module({
  controllers: [IntakeController],
  providers: [IntakeService],
})
export class IntakeModule {}
