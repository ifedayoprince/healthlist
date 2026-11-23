import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AuthModule } from './auth/auth.module.js';
import { ListingModule } from './listing/listing.module.js';
import { IntakeModule } from './intake/intake.module.js';
import { APP_GUARD } from '@nestjs/core';
import { AuthGuard } from './auth/guards/auth.guard.js';
import { AssessmentModule } from './assessment/assessment.module.js';
import { DoctorConsoleModule } from './doctor-console/doctor-console.module.js';

@Module({
  imports: [
    AuthModule,
    ListingModule,
    IntakeModule,
    AssessmentModule,
    DoctorConsoleModule
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AuthGuard
    },
    AppService
  ],
})
export class AppModule { }
