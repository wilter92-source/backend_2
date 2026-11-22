import { User } from '../models/User.js';

export const usersDao = {
  findByEmail(email) {
    return User.exists({ email });
  },
  findCredentialsByEmail(email) {
    return User.findOne({ email }).select('email role +password');
  },
  create(user) {
    return User.create(user);
  }
};
