import { usersRepository } from '../repositories/users.repository.js';
import { isValidEmail, normalizeEmail } from '../utils/email.js';
import { hashPassword, verifyPassword } from '../utils/hash.js';
import { HttpError } from '../utils/HttpError.js';

const REQUIRED_FIELDS = ['first_name', 'last_name', 'email', 'password'];

export class SessionsService {
  constructor(repository) {
    this.repository = repository;
  }

  async login(body) {
    const { email, password } = body ?? {};
    if (typeof email !== 'string' || !email.trim() || typeof password !== 'string' || !password) {
      throw new HttpError(400, 'Email y contraseña son obligatorios');
    }

    const user = await this.repository.findCredentialsByEmail(normalizeEmail(email));
    if (
      !user ||
      Buffer.byteLength(password, 'utf8') > 72 ||
      !(await verifyPassword(password, user.password))
    ) {
      throw new HttpError(401, 'Credenciales inválidas');
    }

    return { id: String(user._id), email: user.email, role: user.role };
  }

  async register(body) {
    if (REQUIRED_FIELDS.some((field) => typeof body?.[field] !== 'string' || !body[field].trim())) {
      throw new HttpError(400, 'Faltan campos obligatorios o no son texto');
    }

    const { first_name, last_name, password } = body;
    const email = normalizeEmail(body.email);

    if (!isValidEmail(email)) {
      throw new HttpError(400, 'Formato de email inválido');
    }
    if ([...password].length < 8 || Buffer.byteLength(password, 'utf8') > 72) {
      throw new HttpError(400, 'La contraseña debe tener al menos 8 caracteres y hasta 72 bytes');
    }

    const duplicate = new HttpError(409, 'El email ya está registrado');
    if (await this.repository.findByEmail(email)) throw duplicate;

    const hash = await hashPassword(password);
    try {
      const user = await this.repository.create({
        first_name: first_name.trim(),
        last_name: last_name.trim(),
        email,
        password: hash
      });
      return {
        id: String(user._id),
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        role: user.role
      };
    } catch (error) {
      // El índice único también cubre solicitudes simultáneas para el mismo correo.
      if (error.code === 11000) throw duplicate;
      throw error;
    }
  }
}

export const sessionsService = new SessionsService(usersRepository);
