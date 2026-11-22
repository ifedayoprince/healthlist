import { IsNotEmpty, IsString } from "class-validator";

export class SubmitOrUpdateAnswerDto {
    @IsString()
    @IsNotEmpty()
    questionKey: string;

    @IsString({ each: true })
    @IsNotEmpty()
    answer: string[];
}
