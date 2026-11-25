import { BadRequestException, ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { createHash, randomInt, timingSafeEqual } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto, RegisterDto, UpdateEmailDto, UpdateProfileDto } from './dto/auth.dto';
import { MailerService } from './mailer.service';
import { requiredConfig } from '../config';

type CodePurpose = 'register' | 'change_email';

const CODE_TTL_MS = 10 * 60 * 1000;
const RESEND_MS = 60 * 1000;
const MAX_ATTEMPTS = 5;

function publicUser(user: User) {
  return {
    id: user.id,
    email: user.email,
    nickname: user.nickname,
    createdAt: user.createdAt,
  };
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly mailer: MailerService,
    private readonly config: ConfigService,
  ) {}

  async sendCode(email: string, purpose: CodePurpose, userId?: string) {
    if (purpose === 'register') {
      const exists = await this.prisma.user.findUnique({ where: { email } });
      if (exists) throw new ConflictException('这个邮箱已经注册过了');
    } else {
      if (!userId) throw new UnauthorizedException('登录已失效');
      const current = await this.prisma.user.findUnique({ where: { id: userId } });
      if (!current) throw new UnauthorizedException('登录已失效');
      if (current.email === email) throw new BadRequestException('这就是当前登录邮箱');
      const taken = await this.prisma.user.findUnique({ where: { email } });
      if (taken) throw new ConflictException('这个邮箱已经注册过了');
    }

    const recent = await this.prisma.emailCode.findFirst({
      where: { email, purpose, createdAt: { gt: new Date(Date.now() - RESEND_MS) } },
    });
    if (recent) throw new BadRequestException('验证码已发送，请 60 秒后再试');

    const code = randomInt(0, 1_000_000).toString().padStart(6, '0');
    await this.prisma.emailCode.deleteMany({ where: { email, purpose } });
    await this.prisma.emailCode.create({
      data: {
        email,
        purpose,
        userId: userId ?? null,
        codeHash: this.hashCode(email, purpose, code),
        expiresAt: new Date(Date.now() + CODE_TTL_MS),
      },
    });

    try {
      return await this.mailer.sendCode(email, code);
    } catch (error) {
      await this.prisma.emailCode.deleteMany({ where: { email, purpose } });
      throw error;
    }
  }

  async register(dto: RegisterDto) {
    const exists = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (exists) throw new ConflictException('这个邮箱已经注册过了');
    await this.consumeCode(dto.email, 'register', dto.code);
    const password = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: { email: dto.email, password, nickname: dto.nickname },
    });
    return this.issue(user);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) throw new UnauthorizedException('邮箱或密码不正确');
    const matched = await bcrypt.compare(dto.password, user.password);
    if (!matched) throw new UnauthorizedException('邮箱或密码不正确');
    return this.issue(user);
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('登录已失效');
    return publicUser(user);
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { nickname: dto.nickname },
    });
    return publicUser(user);
  }

  async updateEmail(userId: string, dto: UpdateEmailDto) {
    const current = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!current) throw new UnauthorizedException('登录已失效');
    if (current.email === dto.email) return publicUser(current);
    const taken = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (taken) throw new ConflictException('这个邮箱已经注册过了');
    await this.consumeCode(dto.email, 'change_email', dto.code, userId);
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { email: dto.email },
    });
    return publicUser(user);
  }

  private async consumeCode(email: string, purpose: CodePurpose, code: string, userId?: string) {
    const row = await this.prisma.emailCode.findFirst({
      where: { email, purpose, userId: userId ?? null },
      orderBy: { createdAt: 'desc' },
    });
    if (!row || row.expiresAt.getTime() < Date.now()) {
      throw new BadRequestException('请先获取邮箱验证码');
    }
    if (row.attempts >= MAX_ATTEMPTS) {
      await this.prisma.emailCode.delete({ where: { id: row.id } });
      throw new BadRequestException('验证次数过多，请重新获取验证码');
    }

    const expected = Buffer.from(this.hashCode(email, purpose, code));
    const actual = Buffer.from(row.codeHash);
    const matched = expected.length === actual.length && timingSafeEqual(expected, actual);
    if (!matched) {
      await this.prisma.emailCode.update({
        where: { id: row.id },
        data: { attempts: { increment: 1 } },
      });
      throw new BadRequestException('验证码不正确');
    }

    await this.prisma.emailCode.deleteMany({ where: { email, purpose } });
  }

  private hashCode(email: string, purpose: CodePurpose, code: string) {
    const secret = requiredConfig(this.config, 'JWT_SECRET');
    return createHash('sha256').update(`${purpose}:${email}:${code}:${secret}`).digest('hex');
  }

  private issue(user: User) {
    const token = this.jwt.sign({ sub: user.id, email: user.email });
    return { token, user: publicUser(user) };
  }
}
