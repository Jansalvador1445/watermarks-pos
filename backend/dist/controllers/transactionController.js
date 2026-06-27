"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteTransaction = exports.updateTransaction = exports.createTransaction = exports.getTransaction = exports.getTransactions = void 0;
const transactionService_1 = require("../services/transactionService");
const response_1 = require("../utils/response");
const params_1 = require("../utils/params");
exports.getTransactions = (0, response_1.asyncHandler)(async (req, res) => {
    const result = await transactionService_1.TransactionService.getAll(req);
    return (0, response_1.paginatedResponse)(res, result.data, result.pagination);
});
exports.getTransaction = (0, response_1.asyncHandler)(async (req, res) => {
    const data = await transactionService_1.TransactionService.getById((0, params_1.getParamId)(req));
    return (0, response_1.successResponse)(res, data);
});
exports.createTransaction = (0, response_1.asyncHandler)(async (req, res) => {
    if (!req.user?.userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    const data = await transactionService_1.TransactionService.create(req.body, req.user.userId);
    return (0, response_1.successResponse)(res, data, 'Transaction created', 201);
});
exports.updateTransaction = (0, response_1.asyncHandler)(async (req, res) => {
    const data = await transactionService_1.TransactionService.update((0, params_1.getParamId)(req), req.body);
    return (0, response_1.successResponse)(res, data, 'Transaction updated');
});
exports.deleteTransaction = (0, response_1.asyncHandler)(async (req, res) => {
    if (!req.user?.userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    await transactionService_1.TransactionService.delete((0, params_1.getParamId)(req), req.user.userId);
    return (0, response_1.successResponse)(res, null, 'Transaction deleted');
});
//# sourceMappingURL=transactionController.js.map