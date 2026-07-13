import { Router } from 'express';
import { AuthController } from './controllers/auth.controller';
import { UserController } from './controllers/user.controller';
import { AuthMiddleware } from './middleware/auth.middleware';
import { RoleMiddleware } from './middleware/role.middleware';

const router = Router();

router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
router.post('/refresh', AuthController.refresh);
router.post('/logout', AuthController.logout);
router.post('/forgot-password', AuthController.forgotPassword);
router.post('/reset-password', AuthController.resetPassword);
router.get('/verify-email', AuthController.verifyEmail);

router.get('/me', AuthMiddleware.requireAuth, UserController.getMe);
router.patch('/profile', AuthMiddleware.requireAuth, UserController.updateProfile);
router.get('/profile', AuthMiddleware.requireAuth, UserController.getProfile);
router.post('/change-password', AuthMiddleware.requireAuth, AuthController.changePassword);
router.post('/resend-verification', AuthMiddleware.requireAuth, AuthController.resendVerification);

router.post('/logout-all', AuthMiddleware.requireAuth, AuthController.logoutAll);
router.get('/sessions', AuthMiddleware.requireAuth, AuthController.getSessions);
router.delete('/sessions/:sessionId', AuthMiddleware.requireAuth, AuthController.revokeSession);

router.get('/admin/users', AuthMiddleware.requireAuth, RoleMiddleware.requireRole('ADMIN'), (req, res) => {
  res.json({ message: 'Admin endpoint' });
});

export default router;
