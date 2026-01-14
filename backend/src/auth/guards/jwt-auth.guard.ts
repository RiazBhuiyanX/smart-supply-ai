import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * JwtAuthGuard - Protects routes requiring authentication
 * 
 * Usage: Add @UseGuards(JwtAuthGuard) decorator to any route or controller
 * 
 * Example:
 * ```typescript
 * @UseGuards(JwtAuthGuard)
 * @Get('profile')
 * getProfile(@Request() req) {
 *   return req.user; // User is available here
 * }
 * ```
 * 
 * How it works:
 * 1. Checks for Authorization: Bearer <token> header
 * 2. Verifies token using JwtStrategy
 * 3. Attaches user to request if valid
 * 4. Returns 401 if invalid or missing
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
