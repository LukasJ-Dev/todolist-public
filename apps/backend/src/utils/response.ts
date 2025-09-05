import { Response } from 'express';
import { ApiSuccessResponse } from '@todolist/types';

function ok<T>(res: Response, data: T) {
  const body: ApiSuccessResponse<T> = {
    success: true,
    data,
    statusCode: 200,
  };
  res.status(200).json(body);
}

function created<T>(res: Response, data: T) {
  const body: ApiSuccessResponse<T> = {
    success: true,
    data,
    statusCode: 201,
  };
  res.status(201).json(body);
}

function noContent<T>(res: Response, data: T) {
  const body: ApiSuccessResponse<T> = {
    success: true,
    data,
    statusCode: 204,
  };
  res.status(204).json(body);
}

export default {
  ok,
  created,
  noContent,
};
