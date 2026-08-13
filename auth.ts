import NextAuth, { CredentialsSignin } from 'next-auth';

class EmailNotVerifiedError extends CredentialsSignin {
  code = "Email not verified";
}
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import Facebook from 'next-auth/providers/facebook';
import connectDB from './lib/mongodb';
import User from './models/User';
import Rider from './models/Rider';
import { EmailService } from './lib/services/emailService';

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    // Customer Email/Password Login
    Credentials({
      id: 'customer-credentials',
      name: 'Customer Login',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          console.log('[AUTH] Missing credentials');
          return null;
        }

        await connectDB();

        const user = await User.findOne({ email: credentials.email });

        if (!user) {
          console.log('[AUTH] User not found:', credentials.email);
          return null;
        }

        console.log('[AUTH] User found:', {
          email: user.email,
          role: user.role,
          isBlocked: user.isBlocked,
          isActive: user.isActive,
          hasPassword: !!user.password,
          emailVerified: user.emailVerified
        });

        if (user.isBlocked) {
          console.log('[AUTH] User is blocked');
          return null;
        }

        if (!user.isActive) {
          console.log('[AUTH] User is not active');
          return null;
        }

        if (!user.password) {
          console.log('[AUTH] User has no password (social login only)');
          return null;
        }

        const isPasswordValid = await user.comparePassword(credentials.password as string);

        if (!isPasswordValid) {
          console.log('[AUTH] Invalid password');
          return null;
        }

        // REQUIRE EMAIL VERIFICATION (except for legacy accounts that don't have emailVerified field)
        if (user.emailVerified === false) {
          console.log('[AUTH] Email not verified. Resending verification email...');
          try {
            await EmailService.resendVerificationEmail(user.email);
          } catch (error) {
            console.error('[AUTH] Failed to resend verification email:', error);
          }
          throw new EmailNotVerifiedError();
        }

        console.log('[AUTH] Login successful for:', user.email);

        // Update last login
        user.lastLogin = new Date();
        await user.save();

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name || `${user.firstname || ''} ${user.lastname || ''}`.trim(),
          role: user.role,
          image: user.profilePicture,
          emailVerified: user.emailVerified || false,
        };
      },
    }),

    // Admin Login (using same User model with admin roles)
    Credentials({
      id: 'admin-credentials',
      name: 'Admin Login',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        await connectDB();

        const admin = await User.findOne({ 
          email: credentials.email,
          role: { $in: ['sadmin', 'admin', 'support'] }
        });

        if (!admin) {
          return null;
        }

        if (!admin.isActive) {
          return null;
        }

        const isPasswordValid = await admin.comparePassword(credentials.password as string);

        if (!isPasswordValid) {
          return null;
        }

        // NOTE: Email verification check removed for admin login
        // Admins can login even without verified email

        admin.lastLogin = new Date();
        await admin.save();

        return {
          id: admin._id.toString(),
          email: admin.email,
          name: admin.name || `${admin.firstname || ''} ${admin.lastname || ''}`.trim(),
          role: admin.role,
          image: admin.profilePicture,
          emailVerified: admin.emailVerified || false,
        };
      },
    }),

    // Rider Login (supports both User with role='rider' AND Rider model)
    Credentials({
      id: 'rider-credentials',
      name: 'Rider Login',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          console.log('[RIDER AUTH] Missing credentials');
          return null;
        }

        await connectDB();

        // First try to find in User collection with role='rider'
        const riderUser = await User.findOne({ 
          email: (credentials.email as string).toLowerCase(),
          role: 'rider' as const
        });

        if (riderUser) {
          console.log('[RIDER AUTH] Found rider in User collection:', riderUser.email);

          if (riderUser.isBlocked || !riderUser.isActive) {
            console.log('[RIDER AUTH] Rider user is blocked or inactive');
            return null;
          }

          if (!riderUser.password) {
            console.log('[RIDER AUTH] Rider user has no password');
            return null;
          }

          const isPasswordValid = await riderUser.comparePassword(credentials.password as string);

          if (!isPasswordValid) {
            console.log('[RIDER AUTH] Invalid password for rider user:', riderUser.email);
            return null;
          }

          // REQUIRE EMAIL VERIFICATION (except for legacy accounts)
          if (riderUser.emailVerified === false) {
            console.log('[RIDER AUTH] Email not verified');
            throw new EmailNotVerifiedError();
          }

          console.log('[RIDER AUTH] Login successful (User collection)');

          riderUser.lastLogin = new Date();
          await riderUser.save();

          return {
            id: riderUser._id.toString(),
            email: riderUser.email,
            name: riderUser.name || `${riderUser.firstname || ''} ${riderUser.lastname || ''}`.trim(),
            role: 'rider',
            image: riderUser.profilePicture,
            emailVerified: riderUser.emailVerified || false,
          };
        }

        // Then try Rider collection
        const rider = await Rider.findOne({ email: (credentials.email as string).toLowerCase() });

        if (!rider) {
          console.log('[RIDER AUTH] Rider not found in either collection:', credentials.email);
          return null;
        }

        console.log('[RIDER AUTH] Found in Rider collection:', {
          email: rider.email,
          status: rider.status,
          documentsVerified: rider.documentsVerified,
          hasPassword: !!rider.password,
        });

        if (rider.status === 'suspended') {
          console.log('[RIDER AUTH] Rider is suspended');
          return null;
        }

        if (!rider.documentsVerified) {
          console.log('[RIDER AUTH] Rider documents not verified');
          return null;
        }

        if (!rider.password) {
          console.log('[RIDER AUTH] Rider has no password');
          return null;
        }

        const isPasswordValid = await rider.comparePassword(credentials.password as string);

        if (!isPasswordValid) {
          console.log('[RIDER AUTH] Invalid password for:', rider.email);
          return null;
        }

        // REQUIRE EMAIL VERIFICATION (except for legacy accounts)
        if (rider.emailVerified === false) {
          console.log('[RIDER AUTH] Email not verified');
          throw new EmailNotVerifiedError();
        }

        console.log('[RIDER AUTH] Login successful (Rider collection)');

        rider.lastActive = new Date();
        await rider.save();

        return {
          id: rider._id.toString(),
          email: rider.email,
          name: rider.fullName,
          role: 'rider',
          image: rider.profilePhoto,
          emailVerified: rider.emailVerified || false,
        };
      },
    }),

    // Google OAuth (optional - only if credentials are provided)
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          Google({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),

    // Facebook OAuth (optional - only if credentials are provided)
    ...(process.env.FACEBOOK_CLIENT_ID && process.env.FACEBOOK_CLIENT_SECRET
      ? [
          Facebook({
            clientId: process.env.FACEBOOK_CLIENT_ID,
            clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
          }),
        ]
      : []),
  ],

  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === 'google' || account?.provider === 'facebook') {
        await connectDB();

        try {
          // Ensure email exists for social providers
          if (!user.email) {
            console.error('Social sign-in error: No email provided');
            return false;
          }

          let existingUser = await User.findOne({ email: user.email });

          if (existingUser) {
            if (!existingUser.authProviderId && account.providerAccountId) {
              existingUser.authProvider = account.provider as any;
              existingUser.authProviderId = account.providerAccountId;
              existingUser.emailVerified = true;
              existingUser.lastLogin = new Date();

              if (user.image && !existingUser.profilePicture) {
                existingUser.profilePicture = user.image;
              }

              await existingUser.save();
            }
          } else {
            existingUser = await User.create({
              email: user.email,
              name: user.name || 'User',
              profilePicture: user.image || undefined,
              authProvider: account.provider,
              authProviderId: account.providerAccountId,
              emailVerified: true,
              role: 'customer',
              walletBalance: 0,
              lastLogin: new Date(),
            });
          }

          user.id = existingUser._id.toString();
          user.role = existingUser.role || 'customer';
          user.emailVerified = existingUser.emailVerified || false;

          return true;
        } catch (error) {
          console.error('Social sign-in error:', error);
          return false;
        }
      }

      return true;
    },

    async jwt({ token, user }) {
      if (user) {
        token.id = user.id || '';
        token.email = user.email || '';
        token.name = user.name || '';
        token.role = user.role || 'customer';
        token.image = user.image || '';
        token.emailVerified = !!user.emailVerified; // Convert to boolean
      }
      return token;
    },

    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.role = token.role as any;
        session.user.image = token.image as string;
        (session.user as any).emailVerified = !!token.emailVerified;
      }
      return session;
    },
  },

  pages: {
    signIn: '/login',
    error: '/login',
  },

  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60,
  },

  secret: process.env.NEXTAUTH_SECRET,
});
