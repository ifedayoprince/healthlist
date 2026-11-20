import { PartialType } from '@nestjs/mapped-types';
import { CreateIntakeDto } from './create-intake.dto.js';

export class UpdateIntakeDto extends PartialType(CreateIntakeDto) {}
