import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto, RegisterDto } from './dto';

/**
 * AuthService - Handles all authentication logic
 * 
 * This service is responsible for:
 * 1. Registering new users (with password hashing)
 * 2. Validating user credentials during login
 * 3. Generating JWT tokens for authenticated users
 * 
 * Password Security:
 * - We use Argon2, the winner of the Password Hashing Competition
 * - Passwords are NEVER stored in plain text
 * - Each password gets a unique salt automatically
 */
@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Register a new user
   * 
   * Steps:
   * 1. Check if email already exists
   * 2. Hash the password using Argon2
   * 3. Create user in database
   * 4. Return user (without password)
   */
  async register(dto: RegisterDto) {
    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash the password - this is a one-way operation
    // The hash includes a unique salt, so same passwords = different hashes
    const hashedPassword = await argon2.hash(dto.password);

    // Create the user in database
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password_hash: hashedPassword,
        first_name: dto.first_name,
        last_name: dto.last_name,
        role: dto.role,
      },
    });

    // Return user without password hash (never expose passwords!)
    const { password_hash, ...result } = user;
    return result;
  }

  /**
   * Validate user credentials
   * 
   * Used by LocalStrategy during login.
   * Returns user if valid, null if invalid.
   */
  async validateUser(email: string, password: string) {
    // Find user by email
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return null;
    }

    // Verify password using Argon2
    // This compares the provided password against the stored hash
    const isPasswordValid = await argon2.verify(user.password_hash, password);

    if (!isPasswordValid) {
      return null;
    }

    // Return user without password
    const { password_hash, ...result } = user;
    return result;
  }

  /**
   * Generate JWT token for authenticated user
   * 
   * The token payload contains:
   * - sub: user ID (subject - standard JWT claim)
   * - email: user's email
   * - role: user's role for authorization
   * 
   * Token is signed with JWT_SECRET and expires based on JWT_EXPIRES_IN
   */
  async login(user: any) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
      },
    };
  }
}
