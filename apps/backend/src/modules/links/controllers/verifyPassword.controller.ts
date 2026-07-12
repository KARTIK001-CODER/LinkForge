import { Request, Response } from 'express';
import { VerifyPasswordService } from '../services/verifyPassword.service';
import { z } from 'zod';

const verifyPasswordService = new VerifyPasswordService();

// Simple runtime validation for the request body
const verifyBodySchema = z.object({
  password: z.string().min(1, 'Password is required')
});

export class VerifyPasswordController {
  static async verify(req: Request, res: Response) {
    try {
      const alias = req.params.alias as string;
      
      const parsedBody = verifyBodySchema.safeParse(req.body);
      if (!parsedBody.success) {
        return res.status(400).json({
          success: false,
          error: { message: parsedBody.error.issues[0]?.message || 'Invalid input' }
        });
      }

      const { password } = parsedBody.data;

      const result = await verifyPasswordService.verifyPassword(alias, password);

      if (!result.success) {
        // Keep error messages generic to prevent info leakage
        return res.status(401).json({
          success: false,
          error: { message: 'Incorrect password' }
        });
      }

      return res.status(200).json({
        success: true,
        data: {
          token: result.token
        }
      });
      
    } catch (error) {
      console.error('[VerifyPassword Error]', error);
      return res.status(500).json({
        success: false,
        error: { message: 'Internal server error during verification' }
      });
    }
  }
}
