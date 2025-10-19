import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { Profile } from 'passport-github2';
import { UserCreateDto } from '../../users/user.model';
import { UserService } from '../../users/user.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    configService: ConfigService,
    private readonly userService: UserService,
  ) {
    const clientId = configService.get<string>('GOOGLE_CLIENT_ID') as string;
    const clientSecret = configService.get<string>('GOOGLE_CLIENT_SECRET') as string;
    const callbackUrl = configService.get<string>('GOOGLE_CALLBACK_URL') as string;

    if (!clientId || !clientSecret || !callbackUrl) {
      throw new Error('Google OAuth env vars are missing');
    }

    super({
      clientID: clientId,
      clientSecret,
      callbackURL: callbackUrl,
      scope: ['profile', 'email'],
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: Profile, done: VerifyCallback): Promise<void> {
    try {
      const { username, displayName, emails, photos } = profile;

      const userDto: UserCreateDto = {
        name: displayName || username || '',
        firstName: '',
        lastName: '',
        email: emails?.[0]?.value || '',
        avatarUrl: photos?.[0]?.value,
      };

      if (!userDto.email || !userDto.name || !accessToken) {
        done('Invalid email or name', undefined);
        return;
      }

      let existingUser = await this.userService.findByEmail(userDto.email);
      if (!existingUser) {
        existingUser = await this.userService.create(userDto);
      }

      if (!existingUser) {
        done('Could not create user from OAuth data', undefined);
        return;
      }

      done(null, existingUser);
    } catch (err) {
      done(err, undefined);
    }
  }
}
