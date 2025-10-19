import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { JwtUserPayload, TokenType } from './auth.model';
import { User } from '../users/user.model';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  private readonly jwtSecret: string;
  private readonly jwtRefreshSecret: string;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    this.jwtSecret = this.configService.get<string>('JWT_SECRET') as string;
    if (!this.jwtSecret) {
      throw new Error('JWT_SECRET is not defined in env');
    }

    this.jwtRefreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET') as string;
    if (!this.jwtRefreshSecret) {
      throw new Error('JWT_REFRESH_SECRET is not defined in env');
    }
  }

  generateJwtTokens(
    user: User,
    updateRefreshToken: boolean = true,
  ): { accessJwtToken: string; refreshJwtToken: string | undefined } {
    try {
      const payload = this.createJwtPayload(user);

      const accessJwtToken = this.jwtService.sign(payload, { expiresIn: '15m', secret: this.jwtSecret });
      let refreshJwtToken: string | undefined = undefined;

      if (updateRefreshToken) {
        refreshJwtToken = this.jwtService.sign(payload, { expiresIn: '7d', secret: this.jwtRefreshSecret });
      }

      return { accessJwtToken, refreshJwtToken };
    } catch (err) {
      throw new UnauthorizedException('Error generating tokens');
    }
  }

  validateToken(token: string, type: TokenType): JwtUserPayload {
    try {
      return this.jwtService.verify<JwtUserPayload>(token, {
        secret: type === TokenType.Refresh ? this.jwtRefreshSecret : this.jwtSecret,
      });
    } catch (err) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  private createJwtPayload(user: User): JwtUserPayload {
    return {
      sub: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
    } as JwtUserPayload;
  }
}
