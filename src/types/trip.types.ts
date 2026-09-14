import { FuelLogDTO } from './index';

// Trip Types
export interface UnforeseeExpense {
  id?: string;
  detail: string;
  amount: number;
}

export interface CreateTripRequest {
  date: string;
  driver_id: string;
  vehicle_id: string;
  client_id?: string;
  bill_of_lading: string;
  estimated_km: number;
  km_start?: number;
  km_end?: number;
  amount_to_pay: number;
  per_diems_delivered: number;
  unforesee_expenses: UnforeseeExpense[];
  fuelLogs?: FuelLogDTO[];
  is_active?: boolean;
  origin?: string;
  destination?: string;
  status?: string;
  loaded_weight_kg?: number;
  net_weight_kg?: number;
  rate_per_kg?: number;
  load_description?: string;
  load_weight_tons?: number;
  load_volume_m3?: number;
  invoice_number?: string;
  notes?: string;
}

export interface Driver {
  id: string;
  full_name: string;
  type: 'PROPIO' | 'CONTRATADO';
  license_exp_date: Date;
  is_active: boolean;
  license_number: string;
  phone?: string;
  document_number?: string;
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date | null;
}

export interface Vehicle {
  id: string;
  plate: string;
  is_owned: boolean;
  truck_rto_exp_date?: Date;
  trailer_plate?: string;
  trailer_rto_exp_date?: Date;
  is_active: boolean;
  vehicle_type: string;
  brand?: string;
  model?: string;
  year?: number;
  capacity_tons?: number;
  capacity_m3?: number;
  registration_number?: string;
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date | null;
}

export interface Client {
  id: string;
  business_name: string;
  contact_email?: string | null;
  contact_phone?: string | null;
  contact_name?: string | null;
  city?: string | null;
  extra_data?: Record<string, any> | null;
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date | null;
}

export interface Trip {
  id: string;
  reference_number: string;
  origin: string;
  destination: string;
  status: string;
  scheduled_date: Date;
  actual_start_date?: Date | null;
  actual_end_date?: Date | null;
  distance_km?: number | null;
  km_start?: number | null;
  km_end?: number | null;
  estimated_cost: number;
  actual_cost?: number | null;
  per_diems_delivered: number;
  load_description?: string | null;
  load_weight_tons?: number | null;
  load_volume_m3?: number | null;
  loaded_weight_kg?: number | null;
  net_weight_kg?: number | null;
  rate_per_kg?: number | null;
  invoice_number?: string | null;
  notes?: string | null;
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date | null;
}

export interface FuelLog {
  id: string;
  vehicle_id: string;
  odometer_reading: number;
  liters_loaded: number;
  fuel_price_per_liter: number;
  total_cost: number;
  station_name?: string;
  notes?: string;
  created_at: Date | string;
  trip_id?: string;
}
