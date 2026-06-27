"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDailyCollection = void 0;
const collectionService_1 = require("../services/collectionService");
const response_1 = require("../utils/response");
exports.getDailyCollection = (0, response_1.asyncHandler)(async (req, res) => {
    const { date } = req.query;
    const data = await collectionService_1.CollectionService.getDaily(date);
    return (0, response_1.successResponse)(res, data);
});
//# sourceMappingURL=collectionController.js.map