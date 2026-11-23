import { IsBoolean, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class SubmitReviewDto {
    @IsBoolean()
    isApproved: boolean;

    @IsString()
    @IsNotEmpty()
    @IsOptional()
    remark?: string;
}
