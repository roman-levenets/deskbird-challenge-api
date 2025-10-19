import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { GitHubStrategy } from './auth-strategies/github.strategy';
import { JwtStrategy } from './auth-strategies/jwt.strategy';
import * as dotenv from 'dotenv';
import { UsersModule } from '../users/users.module';
import { ConfigModule } from '@nestjs/config';
import { RolesGuard } from './roles/roles.guard';
import { GoogleStrategy } from './auth-strategies/google.strategy';

dotenv.config();

@Module({
  controllers: [AuthController],
  providers: [AuthService, GitHubStrategy, GoogleStrategy, JwtStrategy, RolesGuard],
  imports: [ConfigModule, UsersModule, PassportModule, JwtModule],
  exports: [AuthService, RolesGuard],
})
export class AuthModule {}
