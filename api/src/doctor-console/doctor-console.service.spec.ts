import { Test, TestingModule } from '@nestjs/testing';
import { DoctorConsoleService } from './doctor-console.service.js';

describe('DoctorConsoleService', () => {
  let service: DoctorConsoleService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DoctorConsoleService],
    }).compile();

    service = module.get<DoctorConsoleService>(DoctorConsoleService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
