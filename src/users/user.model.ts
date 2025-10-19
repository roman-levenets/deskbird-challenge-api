import { Expose } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export interface User {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl?: string;
  role?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserCreateDto {
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl?: string;
}

export class UpdateUserDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @IsOptional()
  @IsString()
  role?: string;
}

export class UserResponseDto {
  @Expose() id: string;
  @Expose() name: string;
  @Expose() firstName: string;
  @Expose() lastName: string;
  @Expose() email: string;
  @Expose() avatarUrl?: string;
  @Expose() role?: string;
}
