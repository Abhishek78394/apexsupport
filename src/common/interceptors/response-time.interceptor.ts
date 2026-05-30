import { CallHandler, ExecutionContext, Injectable, NestInterceptor, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Response } from 'express';

@Injectable()
export class ResponseTimeInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const req = ctx.getRequest();
    const res = ctx.getResponse<Response>();
    const { method, url } = req;
    
    const now = Date.now();

    return next.handle().pipe(
      tap(() => {
        const responseTime = Date.now() - now;
        
        // Log to terminal (e.g. "GET /api/tenants - 15ms")
        this.logger.log(`${method} ${url} - ${responseTime}ms`);
        
        // Add header to response so it shows up in Swagger
        res.setHeader('X-Response-Time', `${responseTime}ms`);
      }),
    );
  }
}
