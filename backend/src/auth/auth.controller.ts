import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Get,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto';
import { LocalAuthGuard, JwtAuthGuard } from './guards';

/**
 * AuthController - Handles authentication endpoints
 * 
 * Endpoints:
 * - POST /auth/register - Create new user account
 * - POST /auth/login    - Login and get JWT token
 * - GET  /auth/profile  - Get current user (protected)
 */
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Register a new user
   * 
   * POST /auth/register
   * Body: { email, password, first_name, last_name, role }
   * 
   * Returns the created user (without password)
   */
  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  /**
   * Login with email and password
   * 
   * POST /auth/login
   * Body: { email, password }
   * 
   * The @UseGuards(LocalAuthGuard) decorator:
   * 1. Intercepts the request BEFORE this method runs
   * 2. Uses LocalStrategy to validate credentials
   * 3. If valid, attaches user to req.user
   * 4. Then this method runs and generates the JWT
   * 
   * Returns: { access_token, user }
   */
  @UseGuards(LocalAuthGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK) // Return 200 instead of 201 for login
  async login(@Request() req) {
    // req.user is set by LocalAuthGuard after successful validation
    return this.authService.login(req.user);
  }

  /**
   * Get current user profile
   * 
   * GET /auth/profile
   * Header: Authorization: Bearer <token>
   * 
   * The @UseGuards(JwtAuthGuard) decorator:
   * 1. Extracts JWT from Authorization header
   * 2. Validates it using JwtStrategy
   * 3. If valid, attaches user to req.user
   * 
   * This is a test endpoint to verify JWT is working
   */
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req) {
    return req.user;
  }
}
