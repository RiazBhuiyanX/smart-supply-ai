import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from '../auth.service';

/**
 * LocalStrategy - Validates email/password during login
 * 
 * This strategy is used ONLY for the login endpoint.
 * Passport automatically calls validate() when you use @UseGuards(AuthGuard('local'))
 * 
 * How it works:
 * 1. User sends POST /auth/login with { email, password }
 * 2. Passport extracts these fields (we configure it to use 'email' instead of 'username')
 * 3. Passport calls validate(email, password)
 * 4. If validate() returns a user, request.user is set to that user
 * 5. If validate() throws, Passport returns 401 Unauthorized
 */
@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    // Tell Passport to look for 'email' field instead of default 'username'
    super({ usernameField: 'email' });
  }

  /**
   * Validate user credentials
   * 
   * @param email - From request body
   * @param password - From request body
   * @returns User object (without password) if valid
   * @throws UnauthorizedException if invalid
   */
  async validate(email: string, password: string): Promise<any> {
    const user = await this.authService.validateUser(email, password);

    if (!user) {
      // Generic message for security - don't reveal if email exists
      throw new UnauthorizedException('Invalid credentials');
    }

    // This user object will be attached to request.user
    return user;
  }
}
