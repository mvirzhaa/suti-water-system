import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import prisma from './database';
import { Role } from '@prisma/client';
import logger from '../utils/logger';

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID || 'DUMMY_ID',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'DUMMY_SECRET',
      callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/v1/auth/google/callback',
      passReqToCallback: true,
    },
    async (_req, _accessToken, _refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0].value;
        if (!email) {
          return done(new Error('Email tidak ditemukan di profil Google Anda'));
        }

        // 1. Cari user berdasarkan email
        let user = await prisma.user.findUnique({
          where: { email },
        });

        // 2. Jika user belum ada, buat baru (default role STAFF)
        if (!user) {
          user = await prisma.user.create({
            data: {
              email,
              name: profile.displayName,
              googleId: profile.id,
              avatarUrl: profile.photos?.[0].value,
              role: Role.STAFF,
              isActive: true,
            },
          });
          logger.info(`User baru terdaftar via Google: ${email}`);
        } else {
          // 3. Jika user sudah ada tapi belum punya googleId, update
          if (!user.googleId) {
            user = await prisma.user.update({
              where: { id: user.id },
              data: { 
                googleId: profile.id,
                avatarUrl: user.avatarUrl || profile.photos?.[0].value
              },
            });
          }
        }

        return done(null, user);
      } catch (error) {
        logger.error('Google Auth Error:', error);
        return done(error as Error);
      }
    }
  )
);

// Passport session tidak kita gunakan (karena kita pakai JWT), 
// tapi passport tetap butuh serializer kosong
passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj: any, done) => done(null, obj));

export default passport;
