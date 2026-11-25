import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Response } from 'express';

function readMessage(body: string | object): string {
  if (typeof body === 'string') return body;
  if ('message' in body) {
    const message = (body as { message: unknown }).message;
    if (Array.isArray(message)) return String(message[0] ?? '请求失败');
    if (typeof message === 'string') return message;
  }
  return '请求失败';
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      response.status(status).json({
        statusCode: status,
        message: readMessage(exception.getResponse()),
      });
      return;
    }

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      const message =
        exception.code === 'P2002' ? '内容和已有数据重复了' : '数据操作失败';
      response.status(HttpStatus.BAD_REQUEST).json({
        statusCode: HttpStatus.BAD_REQUEST,
        message,
      });
      return;
    }

    console.error(exception);
    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: '服务器开小差了',
    });
  }
}
