import { IsEmail, IsNotEmpty, IsString, IsStrongPassword } from 'class-validator';

export class AuthenticateUserDto {
    @IsString()
    @IsNotEmpty()
    name: string;
    
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @IsStrongPassword()
    @IsNotEmpty()
    password: string;
}
