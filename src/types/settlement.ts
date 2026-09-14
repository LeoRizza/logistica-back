/**
 * Settlement Types
 * Tipos para el módulo de liquidaciones
 */

export enum PaymentMethodEnum {
  CASH = 'CASH',
  TRANSFER = 'TRANSFER',
  CHECK = 'CHECK',
  CREDIT = 'CREDIT',
}

export interface SettlementCalculationInput {
  driver_id: string;
  start_date: string; // ISO format: YYYY-MM-DD
  end_date: string; // ISO format: YYYY-MM-DD
}

export interface TripSummary {
  id: string;
  date: string;
  reference_number: string;
  estimated_cost: number;
  actual_cost: number;
  tripExpenses_total: number;
  distance_km?: number;
}

export interface SettlementData {
  driver_id: string;
  driver_name: string;
  start_date: string;
  end_date: string;
  trips: TripSummary[];
  total_amount_earned: number; // Total ganado por viajes
  total_per_diems_delivered: number; // Total de viáticos entregados
  total_unforesee_expenses: number; // Total de gastos imprevistos
  total_to_pay: number; // Total a pagar (earning - deductions)
  total_deductions: number; // Total de descuentos (viáticos + gastos)
  fuel_expenses?: number; // Gastos de combustible si aplica
  settlement_date?: string;
}

export interface SettlementReceipt extends SettlementData {
  extra_discounts: number; // Descuentos extras agregados manualmente
  bonifications: number; // Bonificaciones agregadas manualmente
  final_amount: number; // Monto final a pagar
  payment_method?: PaymentMethodEnum;
  notes?: string | null;
  created_by_id?: string;
}

export interface CreateSettlementInput extends SettlementData {
  extra_discounts: number;
  bonifications: number;
  payment_method?: PaymentMethodEnum;
  notes?: string;
}

export interface UpdateSettlementInput {
  extra_discounts?: number;
  bonifications?: number;
  payment_method?: PaymentMethodEnum;
  notes?: string;
  is_paid?: boolean;
  payment_date?: Date;
}

export interface SettlementDTO extends Omit<SettlementReceipt, 'start_date' | 'end_date'> {
  id: string;
  start_date: string; // ISO format
  end_date: string; // ISO format
  is_paid: boolean;
  payment_date?: Date | null;
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date | null;
}
