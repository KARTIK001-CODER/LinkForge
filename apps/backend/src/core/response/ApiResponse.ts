import { HTTP_STATUS, HttpStatusCode } from '../constants';

export class ApiResponse<T> {
  public success: boolean;
  public data?: T;
  public message?: string;
  public meta?: any;
  public statusCode: HttpStatusCode;

  constructor(statusCode: HttpStatusCode, data?: T, message?: string, meta?: any) {
    this.statusCode = statusCode;
    this.success = statusCode >= 200 && statusCode < 300;
    this.data = data;
    this.message = message;
    this.meta = meta;
  }

  public static success<T>(data: T, message?: string, meta?: any, statusCode: HttpStatusCode = HTTP_STATUS.OK): ApiResponse<T> {
    return new ApiResponse(statusCode, data, message, meta);
  }

  public static created<T>(data: T, message?: string, meta?: any): ApiResponse<T> {
    return new ApiResponse(HTTP_STATUS.CREATED, data, message, meta);
  }
}

