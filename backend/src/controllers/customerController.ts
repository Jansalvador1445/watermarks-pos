import { Request, Response } from 'express';
import { CustomerService } from '../services/customerService';
import { asyncHandler, successResponse, paginatedResponse } from '../utils/response';
import { getParamId } from '../utils/params';
import { getCustomerPhotoUrl } from '../middlewares/upload';
import { buildMapsUrl, isValidCoordinatePair } from '../utils/customerLocation';

const enrichCustomer = (customer: Record<string, unknown> | object) => {
  const plain = customer as Record<string, unknown>;
  const latitude = plain.latitude as number | undefined;
  const longitude = plain.longitude as number | undefined;
  const mapsUrl =
    isValidCoordinatePair(latitude, longitude) && latitude != null && longitude != null
      ? buildMapsUrl(latitude, longitude)
      : undefined;

  return {
    ...plain,
    propertyPhotoUrl: getCustomerPhotoUrl(plain.propertyPhoto as string | undefined),
    mapsUrl,
  };
};

export const getCustomers = asyncHandler(async (req: Request, res: Response) => {
  const result = await CustomerService.getAll(req);
  const data = result.data.map((c) => enrichCustomer(c));
  return paginatedResponse(res, data, result.pagination);
});

export const getCustomer = asyncHandler(async (req: Request, res: Response) => {
  const data = await CustomerService.getById(getParamId(req));
  const plain = data.toObject();
  return successResponse(res, enrichCustomer(plain));
});

export const createCustomer = asyncHandler(async (req: Request, res: Response) => {
  const data = await CustomerService.create(req.body);
  return successResponse(res, enrichCustomer(data.toObject()), 'Customer created', 201);
});

export const updateCustomer = asyncHandler(async (req: Request, res: Response) => {
  const data = await CustomerService.update(getParamId(req), req.body);
  return successResponse(res, enrichCustomer(data.toObject()), 'Customer updated');
});

export const deleteCustomer = asyncHandler(async (req: Request, res: Response) => {
  await CustomerService.delete(getParamId(req));
  return successResponse(res, null, 'Customer deleted');
});

export const toggleCustomerStatus = asyncHandler(async (req: Request, res: Response) => {
  const data = await CustomerService.toggleStatus(getParamId(req));
  return successResponse(res, data, 'Status updated');
});

export const importCustomers = asyncHandler(async (req: Request, res: Response) => {
  const data = await CustomerService.importCSV(req.body.customers);
  return successResponse(res, data, 'Customers imported', 201);
});

export const uploadCustomerPhoto = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No image uploaded' });
  }
  const data = await CustomerService.uploadPropertyPhoto(getParamId(req), req.file.filename);
  return successResponse(res, enrichCustomer(data.toObject()), 'Photo uploaded');
});

export const deleteCustomerPhoto = asyncHandler(async (req: Request, res: Response) => {
  const data = await CustomerService.deletePropertyPhoto(getParamId(req));
  return successResponse(res, data, 'Photo removed');
});
