"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deletePayment = exports.createPayment = exports.listPaymentsByInvoice = void 0;
const paymentService_1 = require("../services/paymentService");
const response_1 = require("../utils/response");
const params_1 = require("../utils/params");
exports.listPaymentsByInvoice = (0, response_1.asyncHandler)(async (req, res) => {
    const invoiceId = req.params.invoiceId;
    const id = Array.isArray(invoiceId) ? invoiceId[0] : invoiceId;
    const data = await paymentService_1.PaymentService.listByInvoice(id);
    return (0, response_1.successResponse)(res, data);
});
exports.createPayment = (0, response_1.asyncHandler)(async (req, res) => {
    if (!req.user?.userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    const data = await paymentService_1.PaymentService.create({
        invoiceId: req.body.invoiceId,
        amount: req.body.amount,
        paymentMethod: req.body.paymentMethod,
        paymentDate: req.body.paymentDate,
        notes: req.body.notes,
    }, req.user.userId);
    return (0, response_1.successResponse)(res, data, 'Payment recorded', 201);
});
exports.deletePayment = (0, response_1.asyncHandler)(async (req, res) => {
    await paymentService_1.PaymentService.delete((0, params_1.getParamId)(req));
    return (0, response_1.successResponse)(res, null, 'Payment deleted');
});
//# sourceMappingURL=paymentController.js.map