import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsString,
  MinLength,
} from 'class-validator';

/**
 * Available user roles in the system
 * Must match the Role enum in Prisma schema
 */
export enum Role {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  WAREHOUSE_OP = 'WAREHOUSE_OP',
  PROCUREMENT = 'PROCUREMENT',
}

/**
 * Data Transfer Object for user registration
 * 
 * Validates all required fields for creating a new user account.
 * Password must be at least 8 characters for security.
 */
export class RegisterDto {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  @IsNotEmpty({ message: 'Password is required' })
  password: string;

  @IsString()
  @IsNotEmpty({ message: 'First name is required' })
  first_name: string;

  @IsString()
  @IsNotEmpty({ message: 'Last name is required' })
  last_name: string;

  @IsEnum(Role, { message: 'Role must be one of: ADMIN, MANAGER, WAREHOUSE_OP, PROCUREMENT' })
  role: Role;
}
