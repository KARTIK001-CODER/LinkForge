export class EmailService {
  async sendVerificationEmail(to: string, token: string): Promise<void> {
    const url = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email?token=${token}`;
    console.log(`[EmailService] Verification email to ${to}: ${url}`);
  }

  async sendPasswordResetEmail(to: string, token: string): Promise<void> {
    const url = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${token}`;
    console.log(`[EmailService] Password reset email to ${to}: ${url}`);
  }

  async sendWelcomeEmail(to: string): Promise<void> {
    console.log(`[EmailService] Welcome email to ${to}`);
  }
}
