import { Router } from 'express';
import {
  current,
  getSessionsStatus,
  login,
  logout,
  register
} from '../controllers/sessions.controller.js';
import passport from '../config/passport.config.js';

const router = Router();
router.get('/', getSessionsStatus);
router.post('/register', passport.authenticate('register', { session: false }), register);
router.post('/login', passport.authenticate('login', { session: false }), login);
router.get('/current', passport.authenticate('current', { session: false }), current);
router.post('/logout', logout);
export default router;
