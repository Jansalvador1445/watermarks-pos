"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getColorCodeLabel = exports.resolveDeliveryState = exports.computeDeliveryColorCode = exports.getDaysPastDue = void 0;
const dayjs_1 = __importDefault(require("dayjs"));
const getDaysPastDue = (deliveryDate) => {
    const scheduled = (0, dayjs_1.default)(deliveryDate).startOf('day');
    const today = (0, dayjs_1.default)().startOf('day');
    return Math.max(0, today.diff(scheduled, 'day'));
};
exports.getDaysPastDue = getDaysPastDue;
/** Color dot: white = on schedule, orange = 2 days overdue, red = 3+ days overdue */
const computeDeliveryColorCode = (status, deliveryDate) => {
    if (status === 'delivered')
        return 'white';
    const daysPastDue = (0, exports.getDaysPastDue)(deliveryDate);
    if (daysPastDue >= 3)
        return 'red';
    if (daysPastDue >= 2)
        return 'orange';
    return 'white';
};
exports.computeDeliveryColorCode = computeDeliveryColorCode;
const resolveDeliveryState = (status, deliveryDate) => {
    if (status === 'delivered') {
        return { status: 'delivered', colorCode: 'white' };
    }
    const daysPastDue = (0, exports.getDaysPastDue)(deliveryDate);
    if (daysPastDue >= 2) {
        return {
            status: 'overdue',
            colorCode: daysPastDue >= 3 ? 'red' : 'orange',
        };
    }
    return { status: 'pending', colorCode: 'white' };
};
exports.resolveDeliveryState = resolveDeliveryState;
const getColorCodeLabel = (colorCode) => {
    const labels = {
        white: 'On schedule',
        orange: 'Overdue 2 days',
        red: 'Overdue 3+ days',
    };
    return labels[colorCode];
};
exports.getColorCodeLabel = getColorCodeLabel;
//# sourceMappingURL=deliveryColor.js.map