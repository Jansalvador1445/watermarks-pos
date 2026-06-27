"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteProduct = exports.updateProduct = exports.createProduct = exports.getProduct = exports.getActiveProducts = exports.getProducts = void 0;
const productService_1 = require("../services/productService");
const response_1 = require("../utils/response");
const params_1 = require("../utils/params");
exports.getProducts = (0, response_1.asyncHandler)(async (req, res) => {
    const result = await productService_1.ProductService.getAll(req);
    return (0, response_1.paginatedResponse)(res, result.data, result.pagination);
});
exports.getActiveProducts = (0, response_1.asyncHandler)(async (_req, res) => {
    const data = await productService_1.ProductService.getActiveProducts();
    return (0, response_1.successResponse)(res, data);
});
exports.getProduct = (0, response_1.asyncHandler)(async (req, res) => {
    const data = await productService_1.ProductService.getById((0, params_1.getParamId)(req));
    return (0, response_1.successResponse)(res, data);
});
exports.createProduct = (0, response_1.asyncHandler)(async (req, res) => {
    const data = await productService_1.ProductService.create(req.body);
    return (0, response_1.successResponse)(res, data, 'Product created', 201);
});
exports.updateProduct = (0, response_1.asyncHandler)(async (req, res) => {
    const data = await productService_1.ProductService.update((0, params_1.getParamId)(req), req.body);
    return (0, response_1.successResponse)(res, data, 'Product updated');
});
exports.deleteProduct = (0, response_1.asyncHandler)(async (req, res) => {
    await productService_1.ProductService.delete((0, params_1.getParamId)(req));
    return (0, response_1.successResponse)(res, null, 'Product deleted');
});
//# sourceMappingURL=productController.js.map