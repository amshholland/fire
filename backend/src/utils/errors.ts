import { Request, Response, NextFunction } from 'express';
import { prettyPrint } from './logger.js';

export const apiErrorFormatter = (error: any) => {
  const status = error?.status || 500;
  const data = error?.data || { message: 'Internal Server Error' };
  return { error: { ...data, status_code: status } };
};

export const apiErrorMiddleware = (err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  if (err?.response) {
    prettyPrint(err.response?.data || err.response);
    return res.status(err.response?.status || 500).json(apiErrorFormatter(err.response));
  }
  return res.status(500).json({ error: { message: err?.message || 'Unknown error', status_code: 500 } });
};