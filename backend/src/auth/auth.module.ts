import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { LocalStrategy, JwtStrategy } from './strategies';

/**
 * AuthModule - Configures authentication for the application
 * 
 * This module:
 * 1. Imports PassportModule for authentication strategies
 * 2. Configures JwtModule with secret and expiration from environment
 * 3. Provides AuthService for business logic
 * 4. Registers strategies (LocalStrategy, JwtStrategy)
 * 
 * JwtModule.registerAsync:
 * - Uses ConfigService to read JWT_SECRET and JWT_EXPIRES_IN from .env
 * - This is async because we need to wait for ConfigModule to load
 */
@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const expiresIn = configService.get<string>('JWT_EXPIRES_IN') || '7d';
        return {
          secret: configService.get<string>('JWT_SECRET') || 'fallback-secret-change-me',
          signOptions: {
            expiresIn: expiresIn as any, // Type assertion needed for @nestjs/jwt
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, LocalStrategy, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
