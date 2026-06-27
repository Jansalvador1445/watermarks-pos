import { Request, Response } from 'express';
import { AuthService } from '../services/authService';
import { asyncHandler, successResponse } from '../utils/response';
import { AuthRequest } from '../types/express.d';

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { identifier, password } = req.body;
  const result = await AuthService.login(identifier, password, res, req.ip);
  return successResponse(res, result, 'Login successful');
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const token = req.cookies?.refreshToken;
  const result = await AuthService.refresh(token, res);
  return successResponse(res, result, 'Token refreshed');
});

export const logout = asyncHandler(async (req: AuthRequest, res: Response) => {
  const result = await AuthService.logout(req.user!.userId, res);
  return successResponse(res, result, 'Logged out');
});

export const getMe = asyncHandler(async (req: AuthRequest, res: Response) => {
  const result = await AuthService.getMe(req.user!.userId);
  return successResponse(res, result);
});

export const completeOnboarding = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { username, email, password } = req.body;
  const result = await AuthService.completeOnboarding(
    req.user!.userId,
    { username, email, password },
    res,
  );
  return successResponse(res, result, 'Account setup complete');
});
