import { Module } from '@nestjs/common';
import { DoctorConsoleService } from './doctor-console.service.js';
import { DoctorConsoleController } from './doctor-console.controller.js';

@Module({
  controllers: [DoctorConsoleController],
  providers: [DoctorConsoleService],
})
export class DoctorConsoleModule {}
