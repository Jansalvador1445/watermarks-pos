"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCustomerPhoto = exports.uploadCustomerPhoto = exports.importCustomers = exports.toggleCustomerStatus = exports.deleteCustomer = exports.updateCustomer = exports.createCustomer = exports.getCustomer = exports.getCustomers = void 0;
const customerService_1 = require("../services/customerService");
const response_1 = require("../utils/response");
const params_1 = require("../utils/params");
const upload_1 = require("../middlewares/upload");
const customerLocation_1 = require("../utils/customerLocation");
const enrichCustomer = (customer) => {
    const plain = customer;
    const latitude = plain.latitude;
    const longitude = plain.longitude;
    const mapsUrl = (0, customerLocation_1.isValidCoordinatePair)(latitude, longitude) && latitude != null && longitude != null
        ? (0, customerLocation_1.buildMapsUrl)(latitude, longitude)
        : undefined;
    return {
        ...plain,
        propertyPhotoUrl: (0, upload_1.getCustomerPhotoUrl)(plain.propertyPhoto),
        mapsUrl,
    };
};
exports.getCustomers = (0, response_1.asyncHandler)(async (req, res) => {
    const result = await customerService_1.CustomerService.getAll(req);
    const data = result.data.map((c) => enrichCustomer(c));
    return (0, response_1.paginatedResponse)(res, data, result.pagination);
});
exports.getCustomer = (0, response_1.asyncHandler)(async (req, res) => {
    const data = await customerService_1.CustomerService.getById((0, params_1.getParamId)(req));
    const plain = data.toObject();
    return (0, response_1.successResponse)(res, enrichCustomer(plain));
});
exports.createCustomer = (0, response_1.asyncHandler)(async (req, res) => {
    const data = await customerService_1.CustomerService.create(req.body);
    return (0, response_1.successResponse)(res, enrichCustomer(data.toObject()), 'Customer created', 201);
});
exports.updateCustomer = (0, response_1.asyncHandler)(async (req, res) => {
    const data = await customerService_1.CustomerService.update((0, params_1.getParamId)(req), req.body);
    return (0, response_1.successResponse)(res, enrichCustomer(data.toObject()), 'Customer updated');
});
exports.deleteCustomer = (0, response_1.asyncHandler)(async (req, res) => {
    await customerService_1.CustomerService.delete((0, params_1.getParamId)(req));
    return (0, response_1.successResponse)(res, null, 'Customer deleted');
});
exports.toggleCustomerStatus = (0, response_1.asyncHandler)(async (req, res) => {
    const data = await customerService_1.CustomerService.toggleStatus((0, params_1.getParamId)(req));
    return (0, response_1.successResponse)(res, data, 'Status updated');
});
exports.importCustomers = (0, response_1.asyncHandler)(async (req, res) => {
    const data = await customerService_1.CustomerService.importCSV(req.body.customers);
    return (0, response_1.successResponse)(res, data, 'Customers imported', 201);
});
exports.uploadCustomerPhoto = (0, response_1.asyncHandler)(async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'No image uploaded' });
    }
    const data = await customerService_1.CustomerService.uploadPropertyPhoto((0, params_1.getParamId)(req), req.file.filename);
    return (0, response_1.successResponse)(res, enrichCustomer(data.toObject()), 'Photo uploaded');
});
exports.deleteCustomerPhoto = (0, response_1.asyncHandler)(async (req, res) => {
    const data = await customerService_1.CustomerService.deletePropertyPhoto((0, params_1.getParamId)(req));
    return (0, response_1.successResponse)(res, data, 'Photo removed');
});
//# sourceMappingURL=customerController.js.map