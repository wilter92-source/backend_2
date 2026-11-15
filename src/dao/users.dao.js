import { User } from '../models/User.js';

export const usersDao = {
  findByEmail(email) {
    return User.exists({ email });
  },
  create(user) {
    return User.create(user);
  }
};
