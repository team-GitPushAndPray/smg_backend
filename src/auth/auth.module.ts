import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service.js';
import { AuthController } from './auth.controller.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { JwtStrategy } from './strategies/jwt.strategy.js';
import { ModulosGuard } from './guards/modulos.guard.js';


@Module({
  imports: [
    PrismaModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),

    JwtModule.registerAsync({
      useFactory: () => ({
        secret: process.env.JWT_SECRET || 'fallback_secret_dev',
        signOptions: {
          expiresIn: process.env.JWT_EXPIRES_IN || '8h' as any,
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, ModulosGuard],
  exports: [AuthService, JwtStrategy, PassportModule, JwtModule, ModulosGuard],
})
export class AuthModule {}
