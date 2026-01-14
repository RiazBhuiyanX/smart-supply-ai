import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * JwtStrategy - Validates JWT tokens on protected routes
 * 
 * This strategy is used for ALL protected endpoints.
 * When you use @UseGuards(JwtAuthGuard), Passport:
 * 1. Extracts the token from Authorization header (Bearer <token>)
 * 2. Verifies the token signature using JWT_SECRET
 * 3. Checks if token is expired
 * 4. Calls validate() with the decoded payload
 * 5. Attaches the returned value to request.user
 * 
 * If any step fails, returns 401 Unauthorized.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      // Extract JWT from Authorization: Bearer <token>
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      
      // Reject expired tokens
      ignoreExpiration: false,
      
      // Use the same secret that was used to sign the token
      secretOrKey: configService.get<string>('JWT_SECRET') || 'fallback-secret-change-me',
    });
  }

  /**
   * Validate the decoded JWT payload
   * 
   * This method is called AFTER Passport verifies the token signature.
   * The payload contains what we put in during login:
   * - sub: user ID
   * - email: user email
   * - role: user role
   * 
   * We fetch the full user to ensure they still exist and get latest data.
   */
  async validate(payload: { sub: string; email: string; role: string }) {
    // Fetch user from database to ensure they still exist
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user) {
      throw new UnauthorizedException('User no longer exists');
    }

    // Return user without password - this becomes request.user
    const { password_hash, ...result } = user;
    return result;
  }
}
