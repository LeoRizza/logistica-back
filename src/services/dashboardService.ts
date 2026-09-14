import { BaseService } from './baseService';
import { ServiceResponse } from '../types/index';
import { Trip, FuelLog } from '@prisma/client';

/**
 * Dashboard Service
 * Proporciona cálculos financieros para el dashboard gerencial
 */

export interface PNLReport {
  period: {
    startDate: Date;
    endDate: Date;
  };
  operatingIncome: {
    totalTrips: number;
    grossRevenue: number; // Sumatoria de (net_weight_kg * rate_per_kg)
    tripCosts: {
      totalAmountToPay: number;
      totalPerDiemsDelivered: number;
      totalUnforeseeExpenses: number;
    };
    netIncome: number; // grossRevenue - tripCosts total
  };
  indirectCosts: {
    total: number;
    byCategory: Record<string, number>;
  };
  netProfitCompany: number; // operatingIncome.netIncome - indirectCosts.total
  summary: {
    margin: number; // (netProfitCompany / grossRevenue) * 100
    marginPercentage: string;
  };
}

export class DashboardService extends BaseService {
  /**
   * Obtiene el reporte de Estado de Resultados (Profit and Loss)
   */
  async getProfitAndLossReport(startDate: Date, endDate: Date): Promise<ServiceResponse<PNLReport>> {
    try {
      // Validar fechas
      if (startDate > endDate) {
        return this.createErrorResponse('Start date must be before end date');
      }

      // 1. Obtener ingresos operativos (viajes)
      const operatingIncomeResult = await this.getOperatingIncome(startDate, endDate);
      if (!operatingIncomeResult.success) {
        return this.createErrorResponse(operatingIncomeResult.message || 'Failed to calculate operating income');
      }

      // 2. Obtener costos indirectos (gastos generales)
      const indirectCostsResult = await this.getIndirectCosts(startDate, endDate);
      if (!indirectCostsResult.success) {
        return this.createErrorResponse(indirectCostsResult.message || 'Failed to calculate indirect costs');
      }

      const operatingIncome = operatingIncomeResult.data;
      const indirectCosts = indirectCostsResult.data;

      // 3. Calcular ganancia neta de la empresa
      const netProfitCompany = operatingIncome!.netIncome - indirectCosts!.total;

      // 4. Calcular margen
      const grossRevenue = operatingIncome!.grossRevenue;
      const margin = grossRevenue > 0 ? (netProfitCompany / grossRevenue) * 100 : 0;

      const report: PNLReport = {
        period: {
          startDate,
          endDate,
        },
        operatingIncome: operatingIncome!,
        indirectCosts: indirectCosts!,
        netProfitCompany: parseFloat(netProfitCompany.toFixed(2)),
        summary: {
          margin: parseFloat(margin.toFixed(2)),
          marginPercentage: `${parseFloat(margin.toFixed(2))}%`,
        },
      };

      return this.createSuccessResponse(report, 'Profit and Loss report retrieved successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return this.createErrorResponse(`Failed to retrieve P&L report: ${errorMessage}`);
    }
  }

  /**
   * Calcula los ingresos operativos de los viajes
   */
  private async getOperatingIncome(
    startDate: Date,
    endDate: Date
  ): Promise<
    ServiceResponse<{
      totalTrips: number;
      grossRevenue: number;
      tripCosts: {
        totalAmountToPay: number;
        totalPerDiemsDelivered: number;
        totalUnforeseeExpenses: number;
      };
      netIncome: number;
    }>
  > {
    try {
      // Obtener todos los viajes completados en el período
      const trips = await this.prisma.trip.findMany({
        where: {
          deleted_at: null,
          status: { not: 'CANCELLED' },
          scheduled_date: {
            gte: startDate,
            lte: endDate,
          },
        },
      });

      // Obtener gastos de viaje
      const tripExpenses = await this.prisma.tripExpense.findMany({
        where: {
          deleted_at: null,
          trip: {
            scheduled_date: {
              gte: startDate,
              lte: endDate,
            },
            status: { not: 'CANCELLED' },
          },
        },
        include: {
          trip: true,
        },
      });

      // Calcular ingresos brutos (gross revenue)
      let grossRevenue = 0;
      trips.forEach(trip => {
        if (trip.loaded_weight_kg && trip.rate_per_kg) {
          grossRevenue += trip.loaded_weight_kg * trip.rate_per_kg;
        }
      });

      // Calcular costos de viajes
      let totalAmountToPay = 0;
      let totalPerDiemsDelivered = 0;
      let totalUnforeseeExpenses = 0;

      trips.forEach(trip => {
        if (trip.actual_cost) {
          totalAmountToPay += trip.actual_cost;
        }
        if (trip.per_diems_delivered) {
          totalPerDiemsDelivered += trip.per_diems_delivered;
        }
      });

      // Sumar gastos de viaje (TripExpense)
      tripExpenses.forEach(expense => {
        totalUnforeseeExpenses += expense.amount;
      });

      // Calcular total de costos
      const totalTripCosts = totalAmountToPay + totalPerDiemsDelivered + totalUnforeseeExpenses;

      // Calcular ingreso neto operativo
      const netIncome = grossRevenue - totalTripCosts;

      return this.createSuccessResponse(
        {
          totalTrips: trips.length,
          grossRevenue: parseFloat(grossRevenue.toFixed(2)),
          tripCosts: {
            totalAmountToPay: parseFloat(totalAmountToPay.toFixed(2)),
            totalPerDiemsDelivered: parseFloat(totalPerDiemsDelivered.toFixed(2)),
            totalUnforeseeExpenses: parseFloat(totalUnforeseeExpenses.toFixed(2)),
          },
          netIncome: parseFloat(netIncome.toFixed(2)),
        },
        'Operating income calculated successfully'
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return this.createErrorResponse(`Failed to calculate operating income: ${errorMessage}`);
    }
  }

  /**
   * Calcula los costos indirectos (gastos generales)
   */
  private async getIndirectCosts(
    startDate: Date,
    endDate: Date
  ): Promise<
    ServiceResponse<{
      total: number;
      byCategory: Record<string, number>;
    }>
  > {
    try {
      // Obtener todos los gastos de empresa en el período
      const expenses = await this.prisma.companyExpense.findMany({
        where: {
          deleted_at: null,
          expense_date: {
            gte: startDate,
            lte: endDate,
          },
        },
      });

      // Obtener todos los registros de combustible en el período
      const fuelLogs = await this.prisma.fuelLog.findMany({
        where: {
          deleted_at: null,
          created_at: {
            gte: startDate,
            lte: endDate,
          },
        },
      });

      // Calcular total y agrupar por categoría
      let total = 0;
      const byCategory: Record<string, number> = {};

      expenses.forEach(expense => {
        total += expense.amount;

        if (!byCategory[expense.category]) {
          byCategory[expense.category] = 0;
        }
        byCategory[expense.category] += expense.amount;
      });

      // Sumar costos de combustible
      let fuelTotal = 0;
      fuelLogs.forEach(fuelLog => {
        fuelTotal += fuelLog.total_cost;
      });

      // Añadir costos de combustible al total y a la categoría FUEL
      total += fuelTotal;
      if (!byCategory['FUEL']) {
        byCategory['FUEL'] = 0;
      }
      byCategory['FUEL'] += fuelTotal;

      // Redondear todos los valores
      const roundedByCategory: Record<string, number> = {};
      Object.entries(byCategory).forEach(([category, amount]) => {
        roundedByCategory[category] = parseFloat(amount.toFixed(2));
      });

      return this.createSuccessResponse(
        {
          total: parseFloat(total.toFixed(2)),
          byCategory: roundedByCategory,
        },
        'Indirect costs calculated successfully'
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return this.createErrorResponse(`Failed to calculate indirect costs: ${errorMessage}`);
    }
  }
}

export default DashboardService;
