import { usersDao } from '../dao/users.dao.js';

export class UsersRepository {
  constructor(dao) {
    this.dao = dao;
  }

  findByEmail(email) {
    return this.dao.findByEmail(email);
  }

  findCredentialsByEmail(email) {
    return this.dao.findCredentialsByEmail(email);
  }

  create(user) {
    return this.dao.create(user);
  }
}

export const usersRepository = new UsersRepository(usersDao);
