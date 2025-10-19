import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy } from 'passport-github2';
import { UserService } from 'src/users/user.service';
import { UserCreateDto } from 'src/users/user.model';
import { ConfigService } from '@nestjs/config';

type PassportDoneCallback = (
  err: Error | null,
  user: any,
  info?: any
) => void;

@Injectable()
export class GitHubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor(
    configService: ConfigService,
    private readonly userService: UserService,
  ) {
    const clientId = configService.get<string>('GITHUB_CLIENT_ID') as string;
    const clientSecret = configService.get<string>('GITHUB_CLIENT_SECRET') as string;
    const callbackUrl = configService.get<string>('GITHUB_CALLBACK_URL') as string;

    if (!clientId || !clientSecret || !callbackUrl) {
      throw new Error('GitHub OAuth env vars are missing');
    }

    super({
      clientID: clientId,
      clientSecret,
      callbackURL: callbackUrl,
      scope: ['user:email'],
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: Profile, done: PassportDoneCallback): Promise<void> {
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
        return done(new Error('Invalid email or name'), undefined);
      }

      let existingUser = await this.userService.findByEmail(userDto.email);
      if (!existingUser) {
        existingUser = await this.userService.create(userDto);
      }

      if (!existingUser) {
        done(new Error('Could not create user from OAuth data'), undefined);
        return;
      }

      done(null, existingUser);
    } catch (err) {
      done(err, undefined);
    }
  }
}
