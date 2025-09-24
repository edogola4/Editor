import passport from 'passport';
import { Strategy as GitHubStrategy } from 'passport-github2';
import { User } from '../models/User.js';
import { config } from './config.js';
import { sequelize } from './database.js';
import { generateTokens } from '../utils/jwt.js';

const UserModel = User(sequelize);

// Serialize user into the sessions
passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

// Deserialize user from the sessions
passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await UserModel.findByPk(id);
    done(null, user);
  } catch (error) {
    done(error);
  }
});

// GitHub OAuth Strategy
passport.use(
  new GitHubStrategy(
    {
      clientID: config.github.clientId,
      clientSecret: config.github.clientSecret,
      callbackURL: `${config.serverUrl}/api/auth/github/callback`,
      scope: ['user:email'],
    },
    async (
      accessToken: string,
      refreshToken: string,
      profile: any,
      done: any,
    ) => {
      try {
        // Find or create user
        const [user, created] = await UserModel.findOrCreate({
          where: { githubId: profile.id },
          defaults: {
            username: profile.username || profile.emails[0].value.split('@')[0],
            email: profile.emails[0].value,
            githubId: profile.id,
            avatarUrl: profile.photos?.[0]?.value,
            isVerified: true, // GitHub verifies emails
          },
        });

        // Update user data if not just created
        if (!created) {
          await user.update({
            username: profile.username || user.username,
            email: profile.emails[0].value,
            avatarUrl: profile.photos?.[0]?.value || user.avatarUrl,
          });
        }

        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    },
  ),
);

export default passport;
