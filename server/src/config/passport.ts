import passport from 'passport';
import { Strategy as GitHubStrategy } from 'passport-github2';
import { sequelize } from './database.js';
import UserFactory, { UserInstance } from '../models/User.js';
import { config } from './config.js';
import { Sequelize } from 'sequelize';

// Initialize the User model
const User = UserFactory(sequelize);

// Extend Express User type to include our User model
declare global {
  namespace Express {
    interface User extends UserInstance {}
  }
}

passport.serializeUser((user: Express.User, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await User.findByPk(id);
    done(null, user);
  } catch (error) {
    done(error);
  }
});

// GitHub Strategy
passport.use(
  new GitHubStrategy(
    {
      clientID: config.github.clientId,
      clientSecret: config.github.clientSecret,
      callbackURL: `${config.serverUrl}/api/auth/github/callback`,
      scope: ['user:email'],
    },
    async (accessToken: string, refreshToken: string, profile: any, done: (error: any, user?: UserInstance | false | null) => void) => {
      try {
        // Generate a base username from GitHub profile
        const baseUsername = (profile.username || profile.emails[0].value.split('@')[0]).toLowerCase();
        let username = baseUsername;
        let user;
        
        // Try to find existing user by GitHub ID or email
        user = await User.findOne({
          where: {
            [Sequelize.Op.or]: [
              { githubId: profile.id },
              { email: profile.emails[0].value }
            ]
          }
        });

        if (user) {
          // Update existing user with GitHub info if logging in with GitHub for the first time
          if (!user.githubId) {
            await user.update({
              githubId: profile.id,
              avatarUrl: profile.photos?.[0]?.value || user.avatarUrl,
              isVerified: true
            });
          } else if (user.githubId !== profile.id) {
            // Email is already in use by another account
            return done(null, false, { message: 'This email is already registered with a different account.' });
          }
          return done(null, user);
        }

        // If user doesn't exist, create a new one
        let usernameAvailable = false;
        let attempt = 0;
        const maxAttempts = 5;
        
        while (!usernameAvailable && attempt < maxAttempts) {
          try {
            // Try to create user with current username
            const newUsername = attempt === 0 ? username : `${username}${attempt}`;
            user = await User.create({
              username: newUsername,
              email: profile.emails[0].value,
              githubId: profile.id,
              avatarUrl: profile.photos?.[0]?.value,
              role: 'user',
              isVerified: true,
            });
            usernameAvailable = true;
          } catch (error: any) {
            if (error.name === 'SequelizeUniqueConstraintError' && 
                error.errors.some((e: any) => e.path === 'username')) {
              // Username is taken, try with next number
              attempt++;
              if (attempt >= maxAttempts) {
                // If we've tried several times, append a random string
                username = `${baseUsername}${Math.floor(Math.random() * 1000)}`;
              }
            } else {
              // Some other error occurred
              return done(error, null);
            }
          }
        }
        
        // If we get here, all attempts failed
        return done(new Error('Failed to create user after multiple attempts'), null);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

export default passport;
