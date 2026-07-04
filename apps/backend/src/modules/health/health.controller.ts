import { Request, Response } from 'express';
import { HealthService } from './health.service';
import { ApiResponse } from '../../core/response/ApiResponse';
import { HTTP_STATUS, MESSAGES } from '../../core/constants';
import { asyncHandler } from '../../core/utils/asyncHandler';

export class HealthController {
  public static checkHealth = asyncHandler(async (req: Request, res: Response) => {
    const healthData = HealthService.getSystemHealth();
    
    const response = ApiResponse.success(
      healthData,
      MESSAGES.SUCCESS,
      HTTP_STATUS.OK
    );

    res.status(response.statusCode).json(response);
  });
}
