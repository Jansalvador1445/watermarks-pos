import mongoose, { Document, Types } from 'mongoose';
import { CustomerStatus } from '../types/enums';
export interface ICustomerContact {
    name: string;
    position?: string;
    mobile: string;
    email?: string;
}
export interface ICustomer extends Document {
    fullName: string;
    address: string;
    phone: string;
    pricingCategory: Types.ObjectId;
    latitude?: number;
    longitude?: number;
    manualLocation?: string;
    locationNotes?: string;
    /** @deprecated legacy maps URL — use latitude/longitude */
    addressLink?: string;
    propertyPhoto?: string;
    contacts: ICustomerContact[];
    outstandingSlim: number;
    outstandingRound: number;
    status: CustomerStatus;
    isDeleted: boolean;
    deletedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
export declare const Customer: mongoose.Model<ICustomer, {}, {}, {}, mongoose.Document<unknown, {}, ICustomer, {}, mongoose.DefaultSchemaOptions> & ICustomer & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, ICustomer>;
export interface IDelivery extends Document {
    referenceNo: string;
    customerId: Types.ObjectId;
    date: Date;
    schedule: string;
    status: string;
    colorCode: string;
    remarks?: string;
    discount: number;
    paid: boolean;
    slimOut: number;
    roundOut: number;
    slimIn: number;
    roundIn: number;
    slimReturn: number;
    roundReturn: number;
    rescheduleDate?: Date;
    assignedStaffId?: Types.ObjectId;
    continuationDecision?: string;
    inventoryProcessedAt?: Date;
    isDeleted: boolean;
    deletedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
export declare const Delivery: mongoose.Model<IDelivery, {}, {}, {}, mongoose.Document<unknown, {}, IDelivery, {}, mongoose.DefaultSchemaOptions> & IDelivery & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IDelivery>;
//# sourceMappingURL=Customer.d.ts.map