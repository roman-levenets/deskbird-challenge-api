import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UserService } from './user.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  controllers: [UsersController],
  providers: [UserService],
  imports: [ConfigModule],
  exports: [UserService],
})
export class UsersModule {}
