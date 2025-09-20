import express, { Request, Response, NextFunction } from "express";

export const serverError = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const status = error.status || 500;
  const message = error.message || "Server Error";
  const errorCode = error.code || "Error_Code";
  res.status(status).json({ message, error: errorCode });
};
//  app.use((error: any, req: Request, res: Response, next: NextFunction) => {
//   const status = error.status || 500;
//   const message = error.message || "Server Error";
//   const errorCode = error.code || "Error_Code";
//   res.status(status).json({ message, error: errorCode });
// });

export const createError = (message: string, status: number, code: string) => {
  const error: any = new Error(message);
  error.status = status;
  error.code = code;
  return error;
};
