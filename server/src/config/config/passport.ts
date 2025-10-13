import passport from 'passport';
import { Strategy as GitHubStrategy } from 'passport-github2';
import { initializeDatabase } from '../database.js';
import { UserInstance } from '../../models/User.js';
import { config } from '../config';
import { Sequelize } from 'sequelize';
import { stateStore } from '../../utils/stateStore';

let _sequelize: Sequelize;
let _User: () => any;

// Function to initialize passport with database connection
export const initializePassport = async () => {
  if (!_sequelize) {
    _sequelize = await initializeDatabase();
    _User = () => _sequelize.models.User as any;
  }
  return { passport, User: _User };
};

const User = () => {
  if (!_User) {
    throw new Error('Passport not initialized. Call initializePassport() first.');
  }
  return _User();
};

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
    const user = await User().findByPk(id);
    done(null, user);
  } catch (error) {
    done(error);
  }
});

// GitHub Strategy
passport.use(
  'github',
  new GitHubStrategy(
    {
      clientID: config.github.clientId,
      clientSecret: config.github.clientSecret,
      callbackURL: `${config.serverUrl}/api/auth/github/callback`,
      scope: ['user:email'],
      passReqToCallback: true,
      state: true,
      store: {
        store: stateStore,
        state: 'state',
      },
    },
    async (req: any, accessToken: string, refreshToken: string, profile: any, done) => {
      try {
        // Get email from profile or fetch it using the GitHub API
        let email = profile.emails?.[0]?.value || profile._json?.email;
        
        if (!email && accessToken) {
          // If email is not in profile, try to fetch it from GitHub API
          const response = await fetch('https://api.github.com/user/emails', {
            headers: {
              Authorization: `token ${accessToken}`,
              'User-Agent': 'Collab-Editor-App',
            },
          });
          
          if (response.ok) {
            const emails = await response.json();
            const primaryEmail = emails.find((e: any) => e.primary)?.email;
            if (primaryEmail) {
              email = primaryEmail;
            }
          }
        }

        if (!email) {
          return done(new Error('No email found in GitHub profile'));
        }

        // Find or create user
        const [user, created] = await User().findOrCreate({
          where: { githubId: profile.id },
          defaults: {
            username: profile.username,
            email: email,
            displayName: profile.displayName || profile.username,
            avatarUrl: profile._json?.avatar_url,
            githubProfile: profile.profileUrl,
          },
        });

        // Update user data if not just created
        if (!created) {
          await user.update({
            username: profile.username,
            email: email,
            displayName: profile.displayName || profile.username,
            avatarUrl: profile._json?.avatar_url,
            githubProfile: profile.profileUrl,
            lastLogin: new Date(),
          });
        }

        return done(null, user);
      } catch (error) {
        console.error('Error in GitHub OAuth callback:', error);
        return done(error);
      }
    }
  )
);

// Export the initialized passport instance
export default passport;

export const getPassport = () => {
  return passport;
};
