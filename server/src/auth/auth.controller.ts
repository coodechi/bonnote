import { Body, Controller, Get, Patch, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthUser } from './auth-user';
import { CurrentUser } from './current-user.decorator';
import { LoginDto, RegisterDto, SendCodeDto, UpdateEmailDto, UpdateProfileDto } from './dto/auth.dto';
import { Public } from './public.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Post('email-code')
  sendRegisterCode(@Body() dto: SendCodeDto) {
    return this.auth.sendCode(dto.email, 'register');
  }

  @Post('email-code/change')
  sendChangeCode(@CurrentUser() user: AuthUser, @Body() dto: SendCodeDto) {
    return this.auth.sendCode(dto.email, 'change_email', user.id);
  }

  @Public()
  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto);
  }

  @Public()
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }

  @Get('me')
  me(@CurrentUser() user: AuthUser) {
    return this.auth.me(user.id);
  }

  @Patch('me')
  update(@CurrentUser() user: AuthUser, @Body() dto: UpdateProfileDto) {
    return this.auth.updateProfile(user.id, dto);
  }

  @Patch('me/email')
  updateEmail(@CurrentUser() user: AuthUser, @Body() dto: UpdateEmailDto) {
    return this.auth.updateEmail(user.id, dto);
  }
}
