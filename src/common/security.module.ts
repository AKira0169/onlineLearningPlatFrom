import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import * as bcrypt from 'bcryptjs';
import { UserSchema } from '../modules/users/schemas/user.schema';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';

/**
 * Global security/auth infrastructure.
 *
 * The `User` model is registered here (once, with its pre-save password hooks + `correctPassword`
 * method ported from `usersModel.js`) and re-exported so every feature module — auth, users,
 * payment webhook, the JWT guard — shares the same compiled model. JwtModule is configured from
 * the same env vars the original used (`JWT_SECRET`, `JWT_EXPIRES_IN`).
 */
@Global()
@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: config.get<string>('JWT_EXPIRES_IN') as any },
      }),
    }),
    MongooseModule.forFeatureAsync([
      {
        name: 'User',
        useFactory: () => {
          const schema = UserSchema;

          // Hash password before saving.
          schema.pre('save', async function (next) {
            if (!this.isModified('password')) return next();
            this.password = await bcrypt.hash(this.password, 12);
            this.passwordConfirm = undefined;
            next();
          });

          schema.pre('save', function (next) {
            if (!this.isModified('password') || this.isNew) return next();
            this.passwordChangedAt = new Date(Date.now() - 1000);
            next();
          });

          // Instance method to compare a candidate password with the stored hash.
          schema.methods.correctPassword = async function (
            candidatePassword: string,
            userPassword: string,
          ): Promise<boolean> {
            return bcrypt.compare(candidatePassword, userPassword);
          };

          return schema;
        },
      },
    ]),
  ],
  providers: [JwtAuthGuard, RolesGuard],
  exports: [JwtAuthGuard, RolesGuard, JwtModule, MongooseModule],
})
export class SecurityModule {}
