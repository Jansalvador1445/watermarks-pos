import mongoose, { Document, Schema, Types } from 'mongoose';
import { CustomerStatus } from '../types/enums';
import { generateSecureReference } from '../utils/secureReference';

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

const contactSchema = new Schema<ICustomerContact>(
  {
    name: { type: String, required: true, trim: true },
    position: { type: String, trim: true },
    mobile: { type: String, required: true, trim: true },
    email: { type: String, trim: true },
  },
  { _id: true },
);

const customerSchema = new Schema<ICustomer>(
  {
    fullName: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    pricingCategory: { type: Schema.Types.ObjectId, ref: 'PricingTier', required: true },
    latitude: { type: Number, min: -90, max: 90 },
    longitude: { type: Number, min: -180, max: 180 },
    manualLocation: { type: String, trim: true, maxlength: 500 },
    locationNotes: { type: String, trim: true, maxlength: 500 },
    addressLink: { type: String, trim: true },
    propertyPhoto: { type: String, trim: true },
    contacts: { type: [contactSchema], default: [] },
    outstandingSlim: { type: Number, default: 0, min: 0 },
    outstandingRound: { type: Number, default: 0, min: 0 },
    status: { type: String, enum: Object.values(CustomerStatus), default: CustomerStatus.ENABLED },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
  },
  { timestamps: true },
);

customerSchema.index({ fullName: 'text', phone: 'text', address: 'text' });
customerSchema.index({ isDeleted: 1, status: 1 });
customerSchema.index({ pricingCategory: 1 });

export const Customer = mongoose.model<ICustomer>('Customer', customerSchema);

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
  sourceInvoiceId?: Types.ObjectId;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const deliverySchema = new Schema<IDelivery>(
  {
    referenceNo: {
      type: String,
      unique: true,
      default: () => generateSecureReference('DLV'),
    },
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
    date: { type: Date, required: true },
    schedule: { type: String, required: true },
    status: { type: String, default: 'pending' },
    colorCode: { type: String, default: 'white' },
    remarks: { type: String },
    discount: { type: Number, default: 0, min: 0 },
    paid: { type: Boolean, default: false },
    slimOut: { type: Number, default: 0, min: 0 },
    roundOut: { type: Number, default: 0, min: 0 },
    slimIn: { type: Number, default: 0, min: 0 },
    roundIn: { type: Number, default: 0, min: 0 },
    slimReturn: { type: Number, default: 0, min: 0 },
    roundReturn: { type: Number, default: 0, min: 0 },
    rescheduleDate: { type: Date },
    assignedStaffId: { type: Schema.Types.ObjectId, ref: 'User' },
    continuationDecision: {
      type: String,
      enum: ['none', 'pending', 'continued', 'stopped'],
      default: 'none',
    },
    inventoryProcessedAt: { type: Date },
    sourceInvoiceId: { type: Schema.Types.ObjectId, ref: 'Invoice' },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
  },
  { timestamps: true },
);

deliverySchema.index({ date: -1, status: 1 });
deliverySchema.index({ customerId: 1 });
deliverySchema.index({ assignedStaffId: 1, status: 1 });
deliverySchema.index({ isDeleted: 1 });
deliverySchema.index({ referenceNo: 1 });

export const Delivery = mongoose.model<IDelivery>('Delivery', deliverySchema);
