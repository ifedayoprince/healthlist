import { IsUUID } from "class-validator"

export class CreateIntakeSessionDto {
    @IsUUID(undefined, {each: true})
    products: string[];
}
