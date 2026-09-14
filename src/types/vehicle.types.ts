// Vehicle Types
export interface CreateVehicleInput {
  plate: string;
  is_owned?: boolean;
  truck_rto_exp_date?: string | Date;
  trailer_plate?: string;
  trailer_rto_exp_date?: string | Date;
  truck_insurance_exp_date?: string | Date;
  trailer_insurance_exp_date?: string | Date;
  is_active?: boolean;
  vehicle_type: string;
  brand?: string;
  model?: string;
  year?: number;
  capacity_tons?: number;
  capacity_m3?: number;
  registration_number?: string;
  created_by_id: string;
}

export interface UpdateVehicleInput {
  plate?: string;
  is_owned?: boolean;
  truck_rto_exp_date?: string | Date;
  trailer_plate?: string;
  trailer_rto_exp_date?: string | Date;
  truck_insurance_exp_date?: string | Date;
  trailer_insurance_exp_date?: string | Date;
  is_active?: boolean;
  vehicle_type?: string;
  brand?: string;
  model?: string;
  year?: number;
  capacity_tons?: number;
  capacity_m3?: number;
  registration_number?: string;
}

export interface VehicleDTO {
  id: string;
  plate: string;
  is_owned: boolean;
  truck_rto_exp_date: Date | null;
  trailer_plate: string | null;
  trailer_rto_exp_date: Date | null;
  truck_insurance_exp_date: Date | null;
  trailer_insurance_exp_date: Date | null;
  is_active: boolean;
  vehicle_type: string;
  brand: string | null;
  model: string | null;
  year: number | null;
  capacity_tons: number | null;
  capacity_m3: number | null;
  registration_number: string | null;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}
