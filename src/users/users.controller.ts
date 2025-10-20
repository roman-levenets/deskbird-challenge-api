import { Body, Controller, Delete, Get, NotFoundException, Param, Put, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { CurrentUser } from '../auth/current-user.decorator';
import { UpdateUserDto, User, UserResponseDto } from './user.model';
import { AuthGuard } from '@nestjs/passport';
import { plainToInstance } from 'class-transformer';
import { Roles } from '../auth/roles/roles.decorator';

@Controller('api/users')
@UseGuards(AuthGuard('jwt'))
export class UsersController {
  constructor(private readonly userService: UserService) {}

  @Get()
  async getAll() {
    const users = await this.userService.getAll();
    return users.map((user) => plainToInstance(UserResponseDto, user, { excludeExtraneousValues: true }));
  }

  @Get('me')
  async get(@CurrentUser() user: User) {
    const foundUser = await this.userService.getById(user.id);
    return plainToInstance(UserResponseDto, foundUser, { excludeExtraneousValues: true });
  }

  @Roles('admin')
  @Get(':id')
  async getById(@Param('id') id: string) {
    const foundUser = await this.userService.getById(id);
    if (!foundUser) {
      throw new NotFoundException('Not Found');
    }

    return plainToInstance(UserResponseDto, foundUser, { excludeExtraneousValues: true });
  }

  @Roles('admin')
  @Put(':id')
  update(@Param('id') id: string, @Body() updateDto: UpdateUserDto) {
    return this.userService.update(id, updateDto);
  }

  @Roles('admin')
  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.userService.delete(id);
  }
}
