import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

/**
 * Data Transfer Object for user login
 * 
 * DTOs validate incoming request data before it reaches your service.
 * class-validator decorators enforce the rules.
 */
export class LoginDto {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  password: string;
}
