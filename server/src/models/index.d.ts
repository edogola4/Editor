import { UserModel, UserAttributes, UserInstance } from './User.js';

declare const _default: {
  sequelize: any;
  Sequelize: any;
  User: UserModel;
  testConnection: () => Promise<void>;
};

export default _default;
export { UserModel as User, UserAttributes, UserInstance };
