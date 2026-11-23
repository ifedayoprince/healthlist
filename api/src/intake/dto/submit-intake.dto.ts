import { IsArray, IsDefined, IsNotEmpty, IsString, ValidateNested } from "class-validator";
import { Type } from 'class-transformer';

export class AnswerDto {
    @IsString()
    @IsNotEmpty()
    questionKey: string;

    @IsString({ each: true })
    @IsNotEmpty()
    answer: string[];
}

export class SubmitIntakeSessionDto {
    @IsString()
    @IsNotEmpty()
    intakeKey: string;

    @IsArray()
    @IsDefined({ each: true })
    @ValidateNested({ each: true })
    @Type(() => AnswerDto)
    answers: AnswerDto[];

    @IsString({ each: true })
    @IsNotEmpty({each: true})
    /** IDs of the Listings that were removed from this session */
    removedListings: string[];
}
