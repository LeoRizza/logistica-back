import { Request, Response, NextFunction } from 'express';
import { PaymentStatus, TripExpenseCategory } from '@prisma/client';

// Extended Request with user info
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  errors?: Record<string, string[]>;
  timestamp: string;
  path: string;
}

// Error Response
export interface ErrorResponse {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
  statusCode: number;
  timestamp: string;
  path: string;
}

// Pagination
export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Middleware types
export type AsyncHandler = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => Promise<void> | void;

export type ErrorHandler = (
  err: Error | AppError,
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => void;

// Custom Error Class
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public errors?: Record<string, string[]>
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

// Validation types
export interface ValidationSchema {
  [key: string]: (value: unknown) => string | null;
}

// Service Response
export interface ServiceResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

// Enum types from Prisma
export enum UserRoleEnum {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  DISPATCHER = 'DISPATCHER',
  DRIVER = 'DRIVER',
  ACCOUNTANT = 'ACCOUNTANT',
}

export enum DriverTypeEnum {
  PROPIO = 'PROPIO',
  CONTRATADO = 'CONTRATADO',
}

export enum VehicleStatusEnum {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  MAINTENANCE = 'MAINTENANCE',
  RETIRED = 'RETIRED',
}

export enum TripExpenseCategoryEnum {
  FUEL = 'FUEL',
  TOLL = 'TOLL',
  MAINTENANCE = 'MAINTENANCE',
  ACCOMMODATION = 'ACCOMMODATION',
  MEALS = 'MEALS',
  OTHER = 'OTHER',
}

export enum PaymentStatusEnum {
  PENDING = 'PENDING',
  PARTIAL = 'PARTIAL',
  PAID = 'PAID',
  CANCELLED = 'CANCELLED',
}

export enum FuelTypeEnum {
  DIESEL = 'DIESEL',
  GASOLINE = 'GASOLINE',
  LPG = 'LPG',
}

export enum TripStatusEnum {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

// FuelLog Types
export interface CreateFuelLogInput {
  vehicle_id: string;
  liters_loaded: number;
  fuel_price_per_liter?: number; // Optional now, calculated from total_cost if provided
  total_cost?: number; // New: Total amount paid for fuel
  odometer_reading: number;
  fuel_type?: FuelTypeEnum;
  station_name?: string;
  location?: string;
  notes?: string;
  trip_id?: string;
  date?: string | Date; // Optional: Manual creation date for financial accuracy
  created_by_id: string;
}

export interface FuelLogDTO {
  id: string;
  liters_loaded: number;
  liters_per_km: number | null;
  distance_km: number | null;
  fuel_price_per_liter: number;
  total_cost: number;
  odometer_reading: number;
  fuel_type: string;
  station_name: string | null;
  location: string | null;
  notes: string | null;
  trip_id: string | null;
  vehicle_id: string;
  created_by_id: string;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

// TripExpense Types
export interface CreateTripExpenseInput {
  trip_id: string;
  category: TripExpenseCategory;
  amount: number;
  currency?: string;
  description?: string;
  receipt_number?: string;
  notes?: string;
  created_by_id: string;
}

export interface UpdateTripExpenseInput {
  category?: TripExpenseCategory;
  amount?: number;
  currency?: string;
  description?: string;
  receipt_number?: string;
  notes?: string;
  payment_status?: PaymentStatus;
  payment_date?: Date;
}

export interface TripExpenseDTO {
  id: string;
  category: TripExpenseCategory;
  amount: number;
  currency: string;
  description: string | null;
  receipt_number: string | null;
  notes: string | null;
  payment_status: PaymentStatus;
  payment_date: Date | null;
  trip_id: string;
  created_by_id: string;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

// CompanyExpense Types
export interface CreateCompanyExpenseInput {
  name: string;
  description?: string;
  category: string;
  amount: number;
  currency?: string;
  expense_date?: Date;
  due_date?: Date;
  is_recurring?: boolean;
  recurrence_period?: string;
  invoice_number?: string;
  notes?: string;
  payment_status?: string;
  created_by_id: string;
}

export interface UpdateCompanyExpenseInput {
  name?: string;
  description?: string;
  category?: string;
  amount?: number;
  currency?: string;
  expense_date?: Date;
  due_date?: Date;
  is_recurring?: boolean;
  recurrence_period?: string;
  payment_status?: string;
  payment_date?: Date;
  invoice_number?: string;
  notes?: string;
}

export interface CompanyExpenseDTO {
  id: string;
  name: string;
  description: string | null;
  category: string;
  amount: number;
  currency: string;
  expense_date: Date;
  due_date: Date | null;
  is_recurring: boolean;
  recurrence_period: string | null;
  payment_status: string;
  payment_date: Date | null;
  invoice_number: string | null;
  notes: string | null;
  created_by_id: string;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

// Client Types
export interface CreateClientInput {
  business_name: string;
  contact_email?: string;
  contact_phone?: string;
  contact_name?: string;
  city?: string;
  extra_data?: Record<string, any>;
}

export interface UpdateClientInput {
  business_name?: string;
  contact_email?: string;
  contact_phone?: string;
  contact_name?: string;
  city?: string;
  extra_data?: Record<string, any>;
}

export interface ClientDTO {
  id: string;
  business_name: string;
  contact_email: string | null;
  contact_phone: string | null;
  contact_name: string | null;
  city: string | null;
  extra_data: Record<string, any> | null;
  created_by_id: string;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

