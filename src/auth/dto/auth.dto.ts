import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class AuthDto {
  @ApiProperty()
  @IsNotEmpty({ message: 'Email is not provided' })
  @IsEmail({}, { message: 'Email is not valid' })
  email: string;

  @ApiProperty()
  @IsNotEmpty({ message: 'Password is not provided' })
  @IsString()
  password: string;
}
