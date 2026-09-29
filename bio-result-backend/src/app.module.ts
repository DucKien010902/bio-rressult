import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { UsersModule } from './users/users.module.js';
import { AuthModule } from './auth/auth.module.js';
import { CasesModule } from './cases/cases.module.js';
import { NotificationsModule } from './notifications/notifications.module.js';
import { MinioModule } from './minio/minio.module.js';
import { SettingsModule } from './settings/settings.module.js';
import { HttpLoggerMiddleware } from './common/middleware/http-logger.middleware.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const uri = configService.get<string>('MONGO_URI');
        if (!uri) {
          throw new Error('MONGO_URI is not defined in environment variables');
        }
        return {
          uri,
        };
      },
      inject: [ConfigService],
    }),
    ThrottlerModule.forRoot({
      throttlers: [
        {
          name: 'short',
          ttl: 1000,
          limit: 25, // Tối đa 25 requests / 1 giây (chống flood burst)
        },
        {
          name: 'medium',
          ttl: 10000,
          limit: 100, // Tối đa 100 requests / 10 giây
        },
        {
          name: 'long',
          ttl: 60000,
          limit: 300, // Tối đa 300 requests / 1 phút
        },
      ],
      errorMessage:
        'Hệ thống phát hiện tần suất yêu cầu quá cao. Vui lòng thử lại sau ít giây!',
    }),
    UsersModule,
    AuthModule,
    CasesModule,
    NotificationsModule,
    MinioModule,
    SettingsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(HttpLoggerMiddleware).forRoutes('*');
  }
}

