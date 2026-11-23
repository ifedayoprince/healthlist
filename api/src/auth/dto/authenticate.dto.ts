import { IsEmail, IsNotEmpty, IsOptional, IsString, IsStrongPassword } from 'class-validator';

export class AuthenticateUserDto {
    @IsString()
    @IsOptional()
    @IsNotEmpty()
    name?: string;
    
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @IsStrongPassword()
    @IsNotEmpty()
    password: string;
}
