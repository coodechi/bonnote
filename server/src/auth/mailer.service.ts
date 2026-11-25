import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer from 'nodemailer';

@Injectable()
export class MailerService {
  private readonly logger = new Logger(MailerService.name);

  constructor(private readonly config: ConfigService) {}

  async sendCode(email: string, code: string): Promise<{ previewCode?: string }> {
    const host = this.config.get<string>('SMTP_HOST')?.trim();
    if (!host) {
      this.logger.log(`未配置 SMTP，验证码发给 ${email}：${code}`);
      return { previewCode: code };
    }

    const port = Number(this.config.get<string>('SMTP_PORT') ?? 465);
    const user = this.config.get<string>('SMTP_USER')?.trim();
    const pass = this.config.get<string>('SMTP_PASS') ?? '';
    const from = this.config.get<string>('MAIL_FROM')?.trim() || user;
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: user ? { user, pass } : undefined,
    });

    try {
      await transporter.sendMail({
        from,
        to: email,
        subject: 'Bonnote 验证码',
        text: `你的验证码是 ${code}，10 分钟内有效。如果不是你本人操作，忽略这封邮件即可。`,
      });
    } catch (error) {
      this.logger.error(`验证码邮件发送失败：${email}`, error instanceof Error ? error.stack : undefined);
      throw new BadRequestException('验证码邮件发送失败，请稍后再试');
    }

    return {};
  }
}
