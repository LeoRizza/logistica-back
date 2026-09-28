import { FuelLogDTO } from './index';

// Trip Types
export interface UnforeseeExpense {
  id?: string;
  detail: string;
  amount: number;
}

export interface CreateTripRequest {
  date?: string | null;
  driver_id?: string | null;
  vehicle_id?: string | null;
  client_id?: string | null;
  bill_of_lading?: string | null;
  estimated_km?: number | null;
  km_start?: number | null;
  km_end?: number | null;
  amount_to_pay?: number | null;
  per_diems_delivered?: number | null;
  unforesee_expenses?: UnforeseeExpense[];
  fuelLogs?: FuelLogDTO[];
  is_active?: boolean;
  origin?: string | null;
  destination?: string | null;
  status?: string | null;
  loaded_weight_kg?: number | null;
  net_weight_kg?: number | null;
  rate_per_kg?: number | null;
  load_description?: string | null;
  load_weight_tons?: number | null;
  load_volume_m3?: number | null;
  invoice_number?: string | null;
  ctg?: string | null;
  notes?: string | null;
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
  reference_number?: string | null;
  ctg?: string | null;
  origin?: string | null;
  destination?: string | null;
  status?: string | null;
  scheduled_date?: Date | null;
  actual_start_date?: Date | null;
  actual_end_date?: Date | null;
  distance_km?: number | null;
  km_start?: number | null;
  km_end?: number | null;
  estimated_cost?: number | null;
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
  driver_id?: string | null;
  vehicle_id?: string | null;
  client_id?: string | null;
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
