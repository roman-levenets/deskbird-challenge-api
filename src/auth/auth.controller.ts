import { Request, Response } from 'express';
import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { TokenType } from './auth.model';
import { AuthService } from './auth.service';
import { User } from '../users/user.model';
import { UserService } from '../users/user.service';

@Controller('api/auth')
export class AuthController {
  private readonly cors: string[] = [];

  constructor(
    configService: ConfigService,
    private readonly authService: AuthService,
    private readonly userService: UserService,
  ) {
    this.cors = (configService.get<string>('CORS') as string)?.split(',') || [];

    if (!this.cors || !this.cors.length) {
      throw new BadRequestException('CORS is not defined in env');
    }
  }

  @Get('github')
  githubLogin(@Req() req: Request, @Res() res: Response) {
    const clientId = process.env.GITHUB_CLIENT_ID;
    const callbackUrl = process.env.GITHUB_CALLBACK_URL;

    const scope = 'user:email';
    const state = req.query.redirectUrl as string;

    if (!clientId || !callbackUrl) {
      throw new Error('GitHub OAuth env vars are missing');
    }

    const url = new URL('https://github.com/login/oauth/authorize');
    url.searchParams.set('client_id', clientId);
    url.searchParams.set('redirect_uri', callbackUrl);
    url.searchParams.set('scope', scope);
    url.searchParams.set('state', state);

    res.redirect(url.toString());
  }

  @Get('github/callback')
  @UseGuards(AuthGuard('github'))
  githubCallback(@Req() req: Request, @Res() res: Response) {
    return this.handleOAuthCallback(req, res);
  }

  @Get('google')
  googleLogin(@Req() req: Request, @Res() res: Response) {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const callbackUrl = process.env.GOOGLE_CALLBACK_URL;

    const scope = 'email profile';
    const state = req.query.redirectUrl as string;

    if (!clientId || !callbackUrl) {
      throw new Error('Google OAuth env vars are missing');
    }

    const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    url.searchParams.set('client_id', clientId);
    url.searchParams.set('redirect_uri', callbackUrl);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('scope', scope);
    url.searchParams.set('access_type', 'offline');
    url.searchParams.set('prompt', 'consent');
    url.searchParams.set('state', state);

    res.redirect(url.toString());
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  googleCallback(@Req() req: Request, @Res() res: Response) {
    return this.handleOAuthCallback(req, res);
  }

  @Post('authenticateToken')
  async authenticateToken(@Body('token') token: string, @Res({ passthrough: true }) res: Response) {
    const userPayload = this.authService.validateToken(token, TokenType.Access);

    const foundUser = await this.userService.getById(userPayload.sub);
    if (!foundUser) {
      throw new UnauthorizedException('Invalid token');
    }

    const { refreshJwtToken } = this.authService.generateJwtTokens(foundUser, true);

    this.setRefreshTokenCookie(res, refreshJwtToken);

    return {
      accessToken: token,
    };
  }

  @Post('refresh')
  async refresh(@Req() req: Request, @Res() res: Response) {
    const refreshToken = req.cookies['refresh_token'];
    if (!refreshToken) {
      throw new UnauthorizedException('Missing refresh token');
    }

    const payload = this.authService.validateToken(refreshToken, TokenType.Refresh);
    if (!payload || !payload.sub) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = await this.userService.getById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const { accessJwtToken, refreshJwtToken } = this.authService.generateJwtTokens(user);

    this.setRefreshTokenCookie(res, refreshJwtToken);

    return res.json({ accessToken: accessJwtToken });
  }

  @Post('logout')
  logout(@Res() res: Response) {
    res.clearCookie('refresh_token', {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      path: '/',
    });

    res.json({ message: 'Logged out' });
  }

  private handleOAuthCallback(req: Request, res: Response): void {
    const user = req.user as User;

    const tokens = this.authService.generateJwtTokens(user);

    const redirectUrl = decodeURIComponent((req.query.state || '') as string);
    if (!redirectUrl) {
      throw new UnauthorizedException('Redirect URL was not provided');
    }

    const urlObj = new URL(redirectUrl);

    if (!this.cors.includes(urlObj.origin)) {
      throw new ForbiddenException('Redirect URL not allowed');
    }

    return res.redirect(`${redirectUrl}?accessToken=${tokens.accessJwtToken}`);
  }

  private setRefreshTokenCookie(res: Response, refreshToken: string | undefined): void {
    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
  }
}
