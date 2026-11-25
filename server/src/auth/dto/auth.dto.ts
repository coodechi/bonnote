import { Transform } from 'class-transformer';
import { IsEmail, IsString, Matches, MaxLength, MinLength } from 'class-validator';

const codeRule = () =>
  Matches(/^\d{6}$/, { message: '请输入 6 位验证码' });

export class RegisterDto {
  @Transform(({ value }) => String(value ?? '').trim().toLowerCase())
  @IsEmail({}, { message: '请输入有效的邮箱' })
  email!: string;

  @IsString()
  @MinLength(6, { message: '密码至少 6 位' })
  @MaxLength(64, { message: '密码最多 64 位' })
  password!: string;

  @Transform(({ value }) => String(value ?? '').trim())
  @IsString()
  @MinLength(1, { message: '请填写昵称' })
  @MaxLength(20, { message: '昵称最多 20 个字' })
  nickname!: string;

  @Transform(({ value }) => String(value ?? '').trim())
  @IsString()
  @codeRule()
  code!: string;
}

export class LoginDto {
  @Transform(({ value }) => String(value ?? '').trim().toLowerCase())
  @IsEmail({}, { message: '请输入有效的邮箱' })
  email!: string;

  @IsString()
  @MinLength(1, { message: '请输入密码' })
  password!: string;
}

export class SendCodeDto {
  @Transform(({ value }) => String(value ?? '').trim().toLowerCase())
  @IsEmail({}, { message: '请输入有效的邮箱' })
  email!: string;
}

export class UpdateEmailDto {
  @Transform(({ value }) => String(value ?? '').trim().toLowerCase())
  @IsEmail({}, { message: '请输入有效的邮箱' })
  email!: string;

  @Transform(({ value }) => String(value ?? '').trim())
  @IsString()
  @codeRule()
  code!: string;
}

export class UpdateProfileDto {
  @Transform(({ value }) => String(value ?? '').trim())
  @IsString()
  @MinLength(1, { message: '请填写昵称' })
  @MaxLength(20, { message: '昵称最多 20 个字' })
  nickname!: string;
}
