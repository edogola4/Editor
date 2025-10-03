import passport from 'passport';
import { Strategy as GitHubStrategy } from 'passport-github2';
import { sequelize } from './database.js';
import UserFactory, { UserInstance } from '../models/User.js';
import { config } from './config.js';
import { Sequelize, Op } from 'sequelize';
import { stateStore } from '../utils/stateStore';

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
console.log('GitHub OAuth Config:', {
  clientId: config.github.clientId,
  callbackURL: config.github.callbackURL,
  hasClientSecret: !!config.github.clientSecret
});

// Create a custom state handler that works with async/await
const stateHandler = {
  store: (req: any, state: string | undefined, meta: any, callback: (err: Error | null, state?: string) => void) => {
    try {
      // Generate a new state if none provided
      const stateToStore = state || Math.random().toString(36).substring(2, 15);
      console.log('Storing state in state handler:', { state: stateToStore, meta });
      
      // Store the state in Redis
      stateStore.storeState(req, stateToStore, meta, (err, storedState) => {
        if (err) {
          console.error('Error in state store callback:', err);
          return callback(err);
        }
        console.log('State stored successfully:', { state: storedState });
        // Return the state that was stored
        callback(null, storedState);
      });
    } catch (error) {
      console.error('Error in state handler store:', error);
      callback(error as Error);
    }
  },
  verify: (req: any, providedState: string | undefined, callback: any) => {
    try {
      console.log('Verifying state in state handler:', { providedState });
      if (!providedState) {
        const error = new Error('No state provided for verification');
        console.error(error.message);
        return callback(error, false);
      }
      
      stateStore.verifyState(req, providedState, (err, ok, state, meta) => {
        if (err) {
          console.error('Error in state verification callback:', err);
          return callback(err, false);
        }
        
        if (!ok) {
          console.error('State verification failed:', { providedState });
          return callback(new Error('Invalid state'), false);
        }
        
        console.log('State verification successful:', { state, meta });
        callback(null, true, state, meta);
      });
    } catch (error) {
      console.error('Error in state handler verify:', error);
      callback(error, false);
    }
  }
};

passport.use(
  'github',
  new GitHubStrategy(
    {
      clientID: config.github.clientId,
      clientSecret: config.github.clientSecret,
      callbackURL: config.github.callbackURL,
      scope: ['user:email'],
      passReqToCallback: true,
      // Explicit OAuth2 endpoints
      authorizationURL: 'https://github.com/login/oauth/authorize',
      tokenURL: 'https://github.com/login/oauth/access_token',
      userProfileURL: 'https://api.github.com/user',
      // State configuration
      state: true, // Enable state parameter
      store: stateHandler, // Use our custom state handler
      // Add state parameter to authorization URL
      authorizationParams: (params: any) => {
        // Generate a new state if one isn't provided
        const state = params.state || Math.random().toString(36).substring(2, 15);
        return { state };
      }
    },
    async (req: any, accessToken: string, refreshToken: string, profile: any, done: (error: any, user?: UserInstance | false | null) => void) => {
      console.log('GitHub OAuth callback triggered');
      
      // Debug log the raw profile
      console.log('Raw GitHub profile:', JSON.stringify({
        id: profile.id,
        username: profile.username,
        displayName: profile.displayName,
        emails: profile.emails,
        photos: profile.photos,
        _raw: profile._raw,
        _json: profile._json
      }, null, 2));
      
      // Safely log profile information
      const profileInfo = {
        id: profile.id,
        username: profile.username || profile.login,
        displayName: profile.displayName || profile.username || profile._json?.name,
        email: profile.emails?.[0]?.value || profile._json?.email,
        avatarUrl: profile.photos?.[0]?.value || profile._json?.avatar_url,
        profileUrl: profile.profileUrl || profile._json?.html_url
      };
      
      console.log('Processed profile info:', JSON.stringify(profileInfo, null, 2));
      console.log('Access token present:', !!accessToken);
      console.log('Refresh token present:', !!refreshToken);
      
      try {
        // Get email from profile or fetch it using the GitHub API
        let email = profile.emails?.[0]?.value || profile._json?.email;
        
        if (!email && accessToken) {
          try {
            // If no email in profile, try to fetch it from GitHub API
            const emailResponse = await fetch('https://api.github.com/user/emails', {
              headers: {
                'Authorization': `token ${accessToken}`,
                'User-Agent': 'collaborative-code-editor'
              }
            });
            
            if (emailResponse.ok) {
              const emails = await emailResponse.json();
              const primaryEmail = emails.find((e: any) => e.primary) || emails[0];
              if (primaryEmail) {
                email = primaryEmail.email;
                console.log('Fetched email from GitHub API:', email);
              }
            }
          } catch (error) {
            console.error('Error fetching emails from GitHub:', error);
          }
        }
        
        if (!email) {
          return done(new Error('No email found in GitHub profile and could not fetch one'));
        }

        // Generate a base username from GitHub profile
        const baseUsername = (profile.username || profile.login || email.split('@')[0]).toLowerCase();
        let username = baseUsername;
        let user;
        
        // Try to find existing user by GitHub ID or email
        user = await User.findOne({
          where: {
            [Op.or]: [
              { githubId: profile.id },
              { email: email }
            ]
          }
        });
        
        console.log('User lookup result:', user ? 'Found user' : 'No user found');

        if (user) {
          console.log('Found existing user:', user.toJSON());
          try {
            // Update existing user with GitHub info if logging in with GitHub for the first time
            if (!user.githubId) {
              console.log('Updating user with GitHub ID');
              const updatedUser = await user.update({
                githubId: profile.id,
                avatarUrl: profileInfo.avatarUrl || user.avatarUrl,
                isVerified: true
              });
              console.log('Updated user with GitHub info:', updatedUser.toJSON());
              return done(null, updatedUser);
            } else if (user.githubId !== profile.id) {
              // Email is already in use by another account
              const error = new Error('This email is already registered with a different account.');
              console.error(error.message);
              return done(error, false);
            }
            console.log('Returning existing user');
            return done(null, user);
          } catch (error) {
            console.error('Error updating user:', error);
            return done(error);
          }
        }

        // If user doesn't exist, create a new one
        let usernameAvailable = false;
        let attempt = 0;
        const maxAttempts = 5;
        
        while (!usernameAvailable && attempt < maxAttempts) {
          try {
            // Try to create user with current username
            const newUsername = attempt === 0 ? username : `${username}${attempt}`;
            try {
              const newUser = await User.create({
                username: newUsername,
                email: email,
                githubId: profile.id,
                avatarUrl: profileInfo.avatarUrl,
                role: 'user',
                isVerified: true,
              });
              console.log('Created new user:', newUser.toJSON());
              user = newUser; // Assign to outer scope variable
            } catch (createError) {
              console.error('Error creating user:', createError);
              throw createError;
            }
            usernameAvailable = true;
            return done(null, user); // Make sure to call done after successful user creation
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
