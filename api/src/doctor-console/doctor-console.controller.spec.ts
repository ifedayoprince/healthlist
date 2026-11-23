import { Test, TestingModule } from '@nestjs/testing';
import { DoctorConsoleController } from './doctor-console.controller.js';
import { DoctorConsoleService } from './doctor-console.service.js';

describe('DoctorConsoleController', () => {
  let controller: DoctorConsoleController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DoctorConsoleController],
      providers: [DoctorConsoleService],
    }).compile();

    controller = module.get<DoctorConsoleController>(DoctorConsoleController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
