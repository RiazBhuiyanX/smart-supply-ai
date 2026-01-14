import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * LocalAuthGuard - Used for login endpoint only
 * 
 * Usage: Add @UseGuards(LocalAuthGuard) to login endpoint
 * 
 * This guard triggers LocalStrategy which:
 * 1. Extracts email/password from request body
 * 2. Validates credentials via AuthService
 * 3. Attaches user to request.user if valid
 */
@Injectable()
export class LocalAuthGuard extends AuthGuard('local') {}
