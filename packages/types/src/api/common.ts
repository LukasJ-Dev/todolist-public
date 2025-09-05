export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    type: string;
    message: string;
    details?: Array<{
      path: string;
      message: string;
    }>;
  };
}

export interface ApiSuccessResponse<T> extends ApiResponse<T> {
  success: true;
  data: T;
  statusCode: number;
}

export interface ApiErrorResponse extends ApiResponse<null> {
  success: false;
  error: {
    type: string;
    message: string;
    details?: Array<{
      path: string;
      message: string;
    }>;
  };
}
