/**
 * Settlement Service
 * Servicio para cálculo y gestión de liquidaciones de choferes
 */

import { BaseService } from './baseService';
import {
  SettlementCalculationInput,
  SettlementData,
  TripSummary,
  SettlementDTO,
  CreateSettlementInput,
  UpdateSettlementInput,
} from '../types/settlement';
import { prisma } from '../config/database';

class SettlementService extends BaseService {
  /**
   * Calcula liquidación para un chofer en un rango de fechas
   * @param input SettlementCalculationInput
   * @returns SettlementData con todos los cálculos
   */
  async calculateSettlement(input: SettlementCalculationInput): Promise<SettlementData> {
    const { driver_id, start_date, end_date } = input;

    // Validar que el chofer existe
    const driver = await prisma.driver.findUnique({
      where: { id: driver_id },
    });

    if (!driver) {
      throw new Error(`Driver not found with id: ${driver_id}`);
    }

    // Obtener todos los viajes del chofer en el rango de fechas
    const startDateObj = new Date(start_date);
    const endDateObj = new Date(end_date);
    endDateObj.setHours(23, 59, 59, 999); // Incluir todo el último día

    const trips = await prisma.trip.findMany({
      where: {
        driver_id,
        scheduled_date: {
          gte: startDateObj,
          lte: endDateObj,
        },
        deleted_at: null,
      },
      include: {
        tripExpenses: true,
      },
      orderBy: {
        scheduled_date: 'asc',
      },
    });

    // Mapear viajes a TripSummary
    const tripSummaries: TripSummary[] = trips.map((trip) => ({
      id: trip.id,
      date: trip.scheduled_date.toISOString().split('T')[0],
      reference_number: trip.reference_number,
      estimated_cost: trip.estimated_cost,
      actual_cost: trip.actual_cost ?? 0,
      tripExpenses_total: trip.tripExpenses.reduce(
        (sum, expense) => sum + expense.amount,
        0
      ),
      per_diems_delivered: trip.per_diems_delivered || 0,
      distance_km: trip.distance_km ?? undefined,
    }));

    // Calcular totales
    const total_amount_earned = trips.reduce((sum, trip) => sum + trip.estimated_cost, 0);
    const total_trip_expenses = trips.reduce(
      (sum, trip) =>
        sum +
        trip.tripExpenses.reduce((expenseSum, expense) => expenseSum + expense.amount, 0),
      0
    );
    const total_unforesee_expenses = total_trip_expenses;
    const total_per_diems_delivered = trips.reduce((sum, trip) => sum + (trip.per_diems_delivered || 0), 0);

    // Total de descuentos (gastos de viaje + viáticos entregados)
    const total_deductions = total_trip_expenses + total_per_diems_delivered;

    // Total a pagar
    const total_to_pay = total_amount_earned - total_deductions;

    return {
      driver_id,
      driver_name: driver.full_name,
      start_date: start_date,
      end_date: end_date,
      trips: tripSummaries,
      total_amount_earned,
      total_per_diems_delivered,
      total_unforesee_expenses,
      total_to_pay,
      total_deductions,
      settlement_date: new Date().toISOString().split('T')[0],
    };
  }

  /**
   * Guarda una liquidación en la base de datos
   * @param input CreateSettlementInput
   * @param created_by_id ID del usuario que crea la liquidación
   * @returns SettlementDTO
   */
  async createSettlement(
    input: CreateSettlementInput,
    created_by_id: string
  ): Promise<SettlementDTO> {
    // Calcular el monto final
    const final_amount =
      input.total_to_pay - input.extra_discounts + input.bonifications;

    // Crear la liquidación
    const settlement = await prisma.settlement.create({
      data: {
        driver_id: input.driver_id,
        driver_name: input.driver_name,
        start_date: new Date(input.start_date),
        end_date: new Date(input.end_date),
        total_amount_earned: input.total_amount_earned,
        total_per_diems_delivered: input.total_per_diems_delivered,
        total_unforesee_expenses: input.total_unforesee_expenses,
        total_to_pay: input.total_to_pay,
        total_deductions: input.total_deductions,
        extra_discounts: input.extra_discounts,
        bonifications: input.bonifications,
        final_amount: final_amount,
        payment_method: input.payment_method || 'CASH',
        notes: input.notes,
        is_paid: false,
        created_by_id,
      },
    });

    return this.formatSettlementDTO(settlement);
  }

  /**
   * Obtiene una liquidación por ID
   * @param id ID de la liquidación
   * @returns SettlementDTO
   */
  async getSettlementById(id: string): Promise<SettlementDTO> {
    const settlement = await prisma.settlement.findUnique({
      where: { id },
    });

    if (!settlement) {
      throw new Error(`Settlement not found with id: ${id}`);
    }

    return this.formatSettlementDTO(settlement);
  }

  /**
   * Obtiene liquidaciones de un chofer
   * @param driver_id ID del chofer
   * @param limit Cantidad de registros a retornar
   * @param offset Desplazamiento
   * @returns Array de SettlementDTO
   */
  async getSettlementsByDriver(driver_id: string, limit = 10, offset = 0) {
    const [settlements, total] = await Promise.all([
      prisma.settlement.findMany({
        where: { driver_id, deleted_at: null },
        orderBy: { created_at: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.settlement.count({
        where: { driver_id, deleted_at: null },
      }),
    ]);

    return {
      data: settlements.map((s) => this.formatSettlementDTO(s)),
      total,
      limit,
      offset,
    };
  }

  /**
   * Actualiza una liquidación
   * @param id ID de la liquidación
   * @param input UpdateSettlementInput
   * @returns SettlementDTO
   */
  async updateSettlement(id: string, input: UpdateSettlementInput): Promise<SettlementDTO> {
    // Obtener la liquidación actual
    const current = await prisma.settlement.findUnique({
      where: { id },
    });

    if (!current) {
      throw new Error(`Settlement not found with id: ${id}`);
    }

    // Recalcular final_amount si es necesario
    const extra_discounts = input.extra_discounts ?? current.extra_discounts;
    const bonifications = input.bonifications ?? current.bonifications;
    const final_amount = current.total_to_pay - extra_discounts + bonifications;

    // Actualizar
    const updated = await prisma.settlement.update({
      where: { id },
      data: {
        extra_discounts,
        bonifications,
        final_amount,
        payment_method: input.payment_method ?? current.payment_method,
        notes: input.notes ?? current.notes,
        is_paid: input.is_paid ?? current.is_paid,
        payment_date: input.payment_date ?? current.payment_date,
        updated_at: new Date(),
      },
    });

    return this.formatSettlementDTO(updated);
  }

  /**
   * Obtiene todas las liquidaciones
   * @param limit Cantidad de registros
   * @param offset Desplazamiento
   * @returns Array paginado de SettlementDTO
   */
  async getAllSettlements(limit = 10, offset = 0) {
    const [settlements, total] = await Promise.all([
      prisma.settlement.findMany({
        where: { deleted_at: null },
        orderBy: { created_at: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.settlement.count({
        where: { deleted_at: null },
      }),
    ]);

    return {
      data: settlements.map((s) => this.formatSettlementDTO(s)),
      total,
      limit,
      offset,
    };
  }

  /**
   * Marca una liquidación como pagada
   * @param id ID de la liquidación
   * @returns SettlementDTO
   */
  async markAsPaid(id: string): Promise<SettlementDTO> {
    const settlement = await prisma.settlement.update({
      where: { id },
      data: {
        is_paid: true,
        payment_date: new Date(),
        updated_at: new Date(),
      },
    });

    return this.formatSettlementDTO(settlement);
  }

  /**
   * Elimina (soft delete) una liquidación
   * @param id ID de la liquidación
   */
  async deleteSettlement(id: string): Promise<void> {
    await prisma.settlement.update({
      where: { id },
      data: {
        deleted_at: new Date(),
        updated_at: new Date(),
      },
    });
  }

  /**
   * Formatea un settlement de prisma a SettlementDTO
   * @param settlement Settlement de Prisma
   * @returns SettlementDTO
   */
  private formatSettlementDTO(settlement: any): SettlementDTO {
    return {
      id: settlement.id,
      driver_id: settlement.driver_id,
      driver_name: settlement.driver_name,
      start_date: settlement.start_date.toISOString().split('T')[0],
      end_date: settlement.end_date.toISOString().split('T')[0],
      trips: [],
      total_amount_earned: settlement.total_amount_earned,
      total_per_diems_delivered: settlement.total_per_diems_delivered,
      total_unforesee_expenses: settlement.total_unforesee_expenses,
      total_to_pay: settlement.total_to_pay,
      total_deductions: settlement.total_deductions,
      extra_discounts: settlement.extra_discounts,
      bonifications: settlement.bonifications,
      final_amount: settlement.final_amount,
      payment_method: settlement.payment_method as any,
      notes: settlement.notes,
      is_paid: settlement.is_paid,
      payment_date: settlement.payment_date,
      created_at: settlement.created_at,
      updated_at: settlement.updated_at,
      deleted_at: settlement.deleted_at,
    };
  }
}

export default new SettlementService();
