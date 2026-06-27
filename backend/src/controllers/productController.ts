import { Request, Response } from 'express';
import { ProductService } from '../services/productService';
import { asyncHandler, successResponse, paginatedResponse } from '../utils/response';
import { getParamId } from '../utils/params';

export const getProducts = asyncHandler(async (req: Request, res: Response) => {
  const result = await ProductService.getAll(req);
  return paginatedResponse(res, result.data, result.pagination);
});

export const getActiveProducts = asyncHandler(async (_req: Request, res: Response) => {
  const data = await ProductService.getActiveProducts();
  return successResponse(res, data);
});

export const getProduct = asyncHandler(async (req: Request, res: Response) => {
  const data = await ProductService.getById(getParamId(req));
  return successResponse(res, data);
});

export const createProduct = asyncHandler(async (req: Request, res: Response) => {
  const data = await ProductService.create(req.body);
  return successResponse(res, data, 'Product created', 201);
});

export const updateProduct = asyncHandler(async (req: Request, res: Response) => {
  const data = await ProductService.update(getParamId(req), req.body);
  return successResponse(res, data, 'Product updated');
});

export const deleteProduct = asyncHandler(async (req: Request, res: Response) => {
  await ProductService.delete(getParamId(req));
  return successResponse(res, null, 'Product deleted');
});
