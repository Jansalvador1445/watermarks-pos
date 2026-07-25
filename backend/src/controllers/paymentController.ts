import { Response } from 'express';
import { PaymentService } from '../services/paymentService';
import { asyncHandler, successResponse } from '../utils/response';
import { getParamId } from '../utils/params';
import { AuthRequest } from '../types/express.d';
import { PaymentMethod } from '../types/enums';

export const listPaymentsByInvoice = asyncHandler(async (req: AuthRequest, res: Response) => {
  const invoiceId = req.params.invoiceId;
  const id = Array.isArray(invoiceId) ? invoiceId[0] : invoiceId;
  const data = await PaymentService.listByInvoice(id);
  return successResponse(res, data);
});

export const createPayment = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user?.userId) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }
  const data = await PaymentService.create(
    {
      invoiceId: req.body.invoiceId,
      amount: req.body.amount,
      paymentMethod: req.body.paymentMethod as PaymentMethod,
      paymentDate: req.body.paymentDate,
      notes: req.body.notes,
    },
    req.user.userId,
  );
  return successResponse(res, data, 'Payment recorded', 201);
});

export const deletePayment = asyncHandler(async (req: AuthRequest, res: Response) => {
  await PaymentService.delete(getParamId(req));
  return successResponse(res, null, 'Payment deleted');
});
