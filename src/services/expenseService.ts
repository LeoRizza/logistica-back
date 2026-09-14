import { BaseService } from './baseService';
import {
  ServiceResponse,
  CreateCompanyExpenseInput,
  UpdateCompanyExpenseInput,
  CreateTripExpenseInput,
  UpdateTripExpenseInput,
  CompanyExpenseDTO,
  TripExpenseDTO,
} from '../types/index';
import { CompanyExpense, TripExpense } from '@prisma/client';

/**
 * ExpenseService
 * Maneja dos tipos de gastos claramente separados:
 * 1. CompanyExpense: Gastos estructurales de la empresa (salarios, seguros, alquiler, etc.)
 * 2. TripExpense: Gastos asociados a viajes específicos (combustible, peajes, alojamiento, etc.)
 */
export class ExpenseService extends BaseService {
  // ==================== COMPANY EXPENSE METHODS ====================

  /**
   * Crea un nuevo gasto de empresa (companyExpense)
   * Para gastos estructurales como: SALARIES, FUEL, MAINTENANCE, INSURANCE, RENT, etc.
   */
  async createCompanyExpense(input: CreateCompanyExpenseInput): Promise<ServiceResponse<CompanyExpenseDTO>> {
    try {
      // Validar que el usuario existe
      const userExists = await this.prisma.user.findUnique({
        where: { id: input.created_by_id },
      });

      if (!userExists) {
        return this.createErrorResponse(`User with ID ${input.created_by_id} not found`);
      }

      // Validar datos
      if (input.amount <= 0) {
        return this.createErrorResponse('Amount must be greater than 0');
      }

      if (!input.name || input.name.trim() === '') {
        return this.createErrorResponse('Name is required');
      }

      if (!input.category || input.category.trim() === '') {
        return this.createErrorResponse('Category is required');
      }

      // Ensure expense_date is properly parsed as Date
      let expenseDate: Date;
      if (input.expense_date instanceof Date) {
        expenseDate = input.expense_date;
      } else if (typeof input.expense_date === 'string') {
        expenseDate = new Date(input.expense_date);
      } else {
        expenseDate = new Date();
      }

      const companyExpense: CompanyExpense = await this.prisma.companyExpense.create({
        data: {
          name: input.name,
          description: input.description ?? null,
          category: input.category,
          amount: input.amount,
          currency: input.currency ?? 'USD',
          expense_date: expenseDate,
          due_date: input.due_date ?? null,
          is_recurring: input.is_recurring ?? false,
          recurrence_period: input.recurrence_period ?? null,
          invoice_number: input.invoice_number ?? null,
          notes: input.notes ?? null,
          payment_status: 'PAID',
          payment_date: new Date(),
          created_by_id: input.created_by_id,
        },
      });

      const dto = this.mapCompanyExpenseToDTO(companyExpense);

      return this.createSuccessResponse(dto, 'Company expense created successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return this.createErrorResponse(`Failed to create company expense: ${errorMessage}`);
    }
  }

  /**
   * Obtiene todos los gastos de empresa (paginado)
   */
  async getCompanyExpenses(
    page: number,
    limit: number
  ): Promise<ServiceResponse<{ data: CompanyExpenseDTO[]; total: number; page: number; limit: number; totalPages: number }>> {
    try {
      const { skip, take } = this.calculatePagination(page, limit);

      const [expenses, total]: [CompanyExpense[], number] = await Promise.all([
        this.prisma.companyExpense.findMany({
          where: { deleted_at: null },
          orderBy: { created_at: 'desc' },
          skip,
          take,
        }),
        this.prisma.companyExpense.count({ where: { deleted_at: null } }),
      ]);

      const dtos = expenses.map(exp => this.mapCompanyExpenseToDTO(exp));
      const totalPages = Math.ceil(total / limit);

      return this.createSuccessResponse(
        {
          data: dtos,
          total,
          page,
          limit,
          totalPages,
        },
        'Company expenses retrieved successfully'
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return this.createErrorResponse(`Failed to retrieve company expenses: ${errorMessage}`);
    }
  }

  /**
   * Obtiene un gasto de empresa por ID
   */
  async getCompanyExpenseById(id: string): Promise<ServiceResponse<CompanyExpenseDTO>> {
    try {
      if (!this.isValidId(id)) {
        return this.createErrorResponse(`Invalid company expense ID format: ${id}`);
      }

      const expense: CompanyExpense | null = await this.prisma.companyExpense.findUnique({
        where: { id },
      });

      if (!expense || expense.deleted_at !== null) {
        return this.createErrorResponse(`Company expense with ID ${id} not found`);
      }

      const dto = this.mapCompanyExpenseToDTO(expense);

      return this.createSuccessResponse(dto, 'Company expense retrieved successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return this.createErrorResponse(`Failed to retrieve company expense: ${errorMessage}`);
    }
  }

  /**
   * Obtiene gastos de empresa por categoría (paginado)
   */
  async getCompanyExpensesByCategory(
    category: string,
    page: number,
    limit: number
  ): Promise<ServiceResponse<{ data: CompanyExpenseDTO[]; total: number; page: number; limit: number; totalPages: number }>> {
    try {
      const { skip, take } = this.calculatePagination(page, limit);

      const [expenses, total]: [CompanyExpense[], number] = await Promise.all([
        this.prisma.companyExpense.findMany({
          where: {
            category: {
              contains: category,
            },
            deleted_at: null,
          },
          orderBy: { created_at: 'desc' },
          skip,
          take,
        }),
        this.prisma.companyExpense.count({
          where: {
            category: {
              contains: category,
            },
            deleted_at: null,
          },
        }),
      ]);

      const dtos = expenses.map(exp => this.mapCompanyExpenseToDTO(exp));
      const totalPages = Math.ceil(total / limit);

      return this.createSuccessResponse(
        {
          data: dtos,
          total,
          page,
          limit,
          totalPages,
        },
        'Company expenses by category retrieved successfully'
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return this.createErrorResponse(`Failed to retrieve company expenses: ${errorMessage}`);
    }
  }

  /**
   * Obtiene gastos recurrentes de empresa (paginado)
   */
  async getRecurringCompanyExpenses(
    page: number,
    limit: number
  ): Promise<ServiceResponse<{ data: CompanyExpenseDTO[]; total: number; page: number; limit: number; totalPages: number }>> {
    try {
      const { skip, take } = this.calculatePagination(page, limit);

      const [expenses, total]: [CompanyExpense[], number] = await Promise.all([
        this.prisma.companyExpense.findMany({
          where: {
            is_recurring: true,
            deleted_at: null,
          },
          orderBy: { created_at: 'desc' },
          skip,
          take,
        }),
        this.prisma.companyExpense.count({
          where: {
            is_recurring: true,
            deleted_at: null,
          },
        }),
      ]);

      const dtos = expenses.map(exp => this.mapCompanyExpenseToDTO(exp));
      const totalPages = Math.ceil(total / limit);

      return this.createSuccessResponse(
        {
          data: dtos,
          total,
          page,
          limit,
          totalPages,
        },
        'Recurring company expenses retrieved successfully'
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return this.createErrorResponse(`Failed to retrieve recurring company expenses: ${errorMessage}`);
    }
  }

  /**
   * Actualiza un gasto de empresa
   */
  async updateCompanyExpense(
    id: string,
    input: UpdateCompanyExpenseInput
  ): Promise<ServiceResponse<CompanyExpenseDTO>> {
    try {
      if (!this.isValidId(id)) {
        return this.createErrorResponse(`Invalid company expense ID format: ${id}`);
      }

      const existing: CompanyExpense | null = await this.prisma.companyExpense.findUnique({
        where: { id },
      });

      if (!existing || existing.deleted_at !== null) {
        return this.createErrorResponse(`Company expense with ID ${id} not found`);
      }

      // Validaciones
      if (input.amount !== undefined && input.amount <= 0) {
        return this.createErrorResponse('Amount must be greater than 0');
      }

      if (input.name !== undefined && input.name.trim() === '') {
        return this.createErrorResponse('Name cannot be empty');
      }

      if (input.category !== undefined && input.category.trim() === '') {
        return this.createErrorResponse('Category cannot be empty');
      }

      // Ensure expense_date is properly parsed as Date
      let expenseDate: Date | undefined;
      if (input.expense_date instanceof Date) {
        expenseDate = input.expense_date;
      } else if (typeof input.expense_date === 'string') {
        expenseDate = new Date(input.expense_date);
      }

      const updateData: any = {
        name: input.name,
        description: input.description,
        category: input.category,
        amount: input.amount,
        currency: input.currency,
        expense_date: expenseDate,
        due_date: input.due_date,
        is_recurring: input.is_recurring,
        recurrence_period: input.recurrence_period,
        payment_status: 'PAID',
        payment_date: input.payment_date ?? new Date(),
        invoice_number: input.invoice_number,
        notes: input.notes,
      }

      const updated: CompanyExpense = await this.prisma.companyExpense.update({
        where: { id },
        data: updateData,
      });

      const dto = this.mapCompanyExpenseToDTO(updated);

      return this.createSuccessResponse(dto, 'Company expense updated successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return this.createErrorResponse(`Failed to update company expense: ${errorMessage}`);
    }
  }

  /**
   * Marca un gasto de empresa como pagado
   */
  async markCompanyExpenseAsPaid(id: string, paymentDate?: Date): Promise<ServiceResponse<CompanyExpenseDTO>> {
    try {
      if (!this.isValidId(id)) {
        return this.createErrorResponse(`Invalid company expense ID format: ${id}`);
      }

      const existing: CompanyExpense | null = await this.prisma.companyExpense.findUnique({
        where: { id },
      });

      if (!existing || existing.deleted_at !== null) {
        return this.createErrorResponse(`Company expense with ID ${id} not found`);
      }

      const updated: CompanyExpense = await this.prisma.companyExpense.update({
        where: { id },
        data: {
          payment_status: 'PAID',
          payment_date: paymentDate ?? new Date(),
        },
      });

      const dto = this.mapCompanyExpenseToDTO(updated);

      return this.createSuccessResponse(dto, 'Company expense marked as paid');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return this.createErrorResponse(`Failed to mark company expense as paid: ${errorMessage}`);
    }
  }

  /**
   * Obtiene reporte de gastos de empresa en un período
   */
  async getCompanyExpenseReport(
    startDate: Date,
    endDate: Date
  ): Promise<ServiceResponse<{ total: number; byCategory: Record<string, number>; count: number }>> {
    try {
      if (startDate > endDate) {
        return this.createErrorResponse('Start date must be before end date');
      }

      const expenses: CompanyExpense[] = await this.prisma.companyExpense.findMany({
        where: {
          deleted_at: null,
          expense_date: {
            gte: startDate,
            lte: endDate,
          },
        },
      });

      const total = expenses.reduce((sum, exp) => sum + exp.amount, 0);
      const byCategory: Record<string, number> = {};

      expenses.forEach(exp => {
        if (!byCategory[exp.category]) {
          byCategory[exp.category] = 0;
        }
        byCategory[exp.category] += exp.amount;
      });

      return this.createSuccessResponse(
        {
          total: parseFloat(total.toFixed(2)),
          byCategory,
          count: expenses.length,
        },
        'Company expense report retrieved successfully'
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return this.createErrorResponse(`Failed to retrieve company expense report: ${errorMessage}`);
    }
  }

  /**
   * Obtiene el total de gastos de empresa en un mes específico
   */
  async getTotalCompanyExpensesByMonth(
    year: number,
    month: number
  ): Promise<ServiceResponse<{ total: number; count: number }>> {
    try {
      if (month < 1 || month > 12) {
        return this.createErrorResponse('Month must be between 1 and 12');
      }

      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);

      const expenses: CompanyExpense[] = await this.prisma.companyExpense.findMany({
        where: {
          deleted_at: null,
          expense_date: {
            gte: startDate,
            lte: endDate,
          },
        },
      });

      const total = expenses.reduce((sum, exp) => sum + exp.amount, 0);

      return this.createSuccessResponse(
        {
          total: parseFloat(total.toFixed(2)),
          count: expenses.length,
        },
        'Monthly company expenses retrieved successfully'
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return this.createErrorResponse(`Failed to retrieve monthly company expenses: ${errorMessage}`);
    }
  }

  /**
   * Elimina (soft delete) un gasto de empresa
   */
  async deleteCompanyExpense(id: string): Promise<ServiceResponse<null>> {
    try {
      if (!this.isValidId(id)) {
        return this.createErrorResponse(`Invalid company expense ID format: ${id}`);
      }

      const existing: CompanyExpense | null = await this.prisma.companyExpense.findUnique({
        where: { id },
      });

      if (!existing || existing.deleted_at !== null) {
        return this.createErrorResponse(`Company expense with ID ${id} not found`);
      }

      await this.prisma.companyExpense.update({
        where: { id },
        data: { deleted_at: new Date() },
      });

      return this.createSuccessResponse(null, 'Company expense deleted successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return this.createErrorResponse(`Failed to delete company expense: ${errorMessage}`);
    }
  }

  // ==================== TRIP EXPENSE METHODS ====================

  /**
   * Crea un nuevo gasto de viaje (tripExpense)
   * Para gastos asociados a un viaje: FUEL, TOLL, MEALS, ACCOMMODATION, etc.
   */
  async createTripExpense(input: CreateTripExpenseInput): Promise<ServiceResponse<TripExpenseDTO>> {
    try {
      // Validar que el viaje existe
      const tripExists = await this.prisma.trip.findUnique({
        where: { id: input.trip_id },
      });

      if (!tripExists) {
        return this.createErrorResponse(`Trip with ID ${input.trip_id} not found`);
      }

      // Validar que el usuario existe
      const userExists = await this.prisma.user.findUnique({
        where: { id: input.created_by_id },
      });

      if (!userExists) {
        return this.createErrorResponse(`User with ID ${input.created_by_id} not found`);
      }

      // Validar datos
      if (input.amount <= 0) {
        return this.createErrorResponse('Amount must be greater than 0');
      }

      const tripExpense: TripExpense = await this.prisma.tripExpense.create({
        data: {
          trip_id: input.trip_id,
          category: input.category,
          amount: input.amount,
          currency: input.currency ?? 'USD',
          description: input.description ?? null,
          receipt_number: input.receipt_number ?? null,
          notes: input.notes ?? null,
          created_by_id: input.created_by_id,
          payment_status: 'PENDING',
        },
      });

      const dto = this.mapTripExpenseToDTO(tripExpense);

      return this.createSuccessResponse(dto, 'Trip expense created successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return this.createErrorResponse(`Failed to create trip expense: ${errorMessage}`);
    }
  }

  /**
   * Obtiene todos los gastos de un viaje específico
   */
  async getTripExpensesByTrip(
    tripId: string,
    page: number,
    limit: number
  ): Promise<ServiceResponse<{ data: TripExpenseDTO[]; total: number; page: number; limit: number; totalPages: number }>> {
    try {
      // Validar que el viaje existe
      const tripExists = await this.prisma.trip.findUnique({
        where: { id: tripId },
      });

      if (!tripExists) {
        return this.createErrorResponse(`Trip with ID ${tripId} not found`);
      }

      const { skip, take } = this.calculatePagination(page, limit);

      const [expenses, total]: [TripExpense[], number] = await Promise.all([
        this.prisma.tripExpense.findMany({
          where: {
            trip_id: tripId,
            deleted_at: null,
          },
          orderBy: { created_at: 'desc' },
          skip,
          take,
        }),
        this.prisma.tripExpense.count({
          where: {
            trip_id: tripId,
            deleted_at: null,
          },
        }),
      ]);

      const dtos = expenses.map(exp => this.mapTripExpenseToDTO(exp));
      const totalPages = Math.ceil(total / limit);

      return this.createSuccessResponse(
        {
          data: dtos,
          total,
          page,
          limit,
          totalPages,
        },
        'Trip expenses retrieved successfully'
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return this.createErrorResponse(`Failed to retrieve trip expenses: ${errorMessage}`);
    }
  }

  /**
   * Obtiene un gasto de viaje por ID
   */
  async getTripExpenseById(id: string): Promise<ServiceResponse<TripExpenseDTO>> {
    try {
      if (!this.isValidId(id)) {
        return this.createErrorResponse(`Invalid trip expense ID format: ${id}`);
      }

      const expense: TripExpense | null = await this.prisma.tripExpense.findUnique({
        where: { id },
      });

      if (!expense || expense.deleted_at !== null) {
        return this.createErrorResponse(`Trip expense with ID ${id} not found`);
      }

      const dto = this.mapTripExpenseToDTO(expense);

      return this.createSuccessResponse(dto, 'Trip expense retrieved successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return this.createErrorResponse(`Failed to retrieve trip expense: ${errorMessage}`);
    }
  }

  /**
   * Actualiza un gasto de viaje
   */
  async updateTripExpense(
    id: string,
    input: UpdateTripExpenseInput
  ): Promise<ServiceResponse<TripExpenseDTO>> {
    try {
      if (!this.isValidId(id)) {
        return this.createErrorResponse(`Invalid trip expense ID format: ${id}`);
      }

      const existing: TripExpense | null = await this.prisma.tripExpense.findUnique({
        where: { id },
      });

      if (!existing || existing.deleted_at !== null) {
        return this.createErrorResponse(`Trip expense with ID ${id} not found`);
      }

      // Validaciones
      if (input.amount !== undefined && input.amount <= 0) {
        return this.createErrorResponse('Amount must be greater than 0');
      }

      const updated: TripExpense = await this.prisma.tripExpense.update({
        where: { id },
        data: {
          category: input.category,
          amount: input.amount,
          currency: input.currency,
          description: input.description,
          receipt_number: input.receipt_number,
          notes: input.notes,
          payment_status: input.payment_status,
          payment_date: input.payment_date,
        },
      });

      const dto = this.mapTripExpenseToDTO(updated);

      return this.createSuccessResponse(dto, 'Trip expense updated successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return this.createErrorResponse(`Failed to update trip expense: ${errorMessage}`);
    }
  }

  /**
   * Marca un gasto de viaje como pagado
   */
  async markTripExpenseAsPaid(id: string, paymentDate?: Date): Promise<ServiceResponse<TripExpenseDTO>> {
    try {
      if (!this.isValidId(id)) {
        return this.createErrorResponse(`Invalid trip expense ID format: ${id}`);
      }

      const existing: TripExpense | null = await this.prisma.tripExpense.findUnique({
        where: { id },
      });

      if (!existing || existing.deleted_at !== null) {
        return this.createErrorResponse(`Trip expense with ID ${id} not found`);
      }

      const updated: TripExpense = await this.prisma.tripExpense.update({
        where: { id },
        data: {
          payment_status: 'PAID',
          payment_date: paymentDate ?? new Date(),
        },
      });

      const dto = this.mapTripExpenseToDTO(updated);

      return this.createSuccessResponse(dto, 'Trip expense marked as paid');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return this.createErrorResponse(`Failed to mark trip expense as paid: ${errorMessage}`);
    }
  }

  /**
   * Calcula el total de gastos de un viaje
   */
  async getTripExpensesTotal(tripId: string): Promise<ServiceResponse<{ total: number; byCategory: Record<string, number> }>> {
    try {
      // Validar que el viaje existe
      const tripExists = await this.prisma.trip.findUnique({
        where: { id: tripId },
      });

      if (!tripExists) {
        return this.createErrorResponse(`Trip with ID ${tripId} not found`);
      }

      const expenses: TripExpense[] = await this.prisma.tripExpense.findMany({
        where: {
          trip_id: tripId,
          deleted_at: null,
        },
      });

      const total = expenses.reduce((sum, exp) => sum + exp.amount, 0);
      const byCategory: Record<string, number> = {};

      expenses.forEach(exp => {
        if (!byCategory[exp.category]) {
          byCategory[exp.category] = 0;
        }
        byCategory[exp.category] += exp.amount;
      });

      return this.createSuccessResponse(
        {
          total: parseFloat(total.toFixed(2)),
          byCategory,
        },
        'Trip expenses total calculated successfully'
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return this.createErrorResponse(`Failed to calculate trip expenses total: ${errorMessage}`);
    }
  }

  /**
   * Elimina (soft delete) un gasto de viaje
   */
  async deleteTripExpense(id: string): Promise<ServiceResponse<null>> {
    try {
      if (!this.isValidId(id)) {
        return this.createErrorResponse(`Invalid trip expense ID format: ${id}`);
      }

      const existing: TripExpense | null = await this.prisma.tripExpense.findUnique({
        where: { id },
      });

      if (!existing || existing.deleted_at !== null) {
        return this.createErrorResponse(`Trip expense with ID ${id} not found`);
      }

      await this.prisma.tripExpense.update({
        where: { id },
        data: { deleted_at: new Date() },
      });

      return this.createSuccessResponse(null, 'Trip expense deleted successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return this.createErrorResponse(`Failed to delete trip expense: ${errorMessage}`);
    }
  }

  // ==================== HELPER METHODS ====================

  /**
   * Mapea un objeto CompanyExpense a CompanyExpenseDTO
   */
  private mapCompanyExpenseToDTO(expense: CompanyExpense): CompanyExpenseDTO {
    return {
      id: expense.id,
      name: expense.name,
      description: expense.description,
      category: expense.category,
      amount: expense.amount,
      currency: expense.currency,
      expense_date: expense.expense_date,
      due_date: expense.due_date,
      is_recurring: expense.is_recurring,
      recurrence_period: expense.recurrence_period,
      payment_status: expense.payment_status,
      payment_date: expense.payment_date,
      invoice_number: expense.invoice_number,
      notes: expense.notes,
      created_by_id: expense.created_by_id,
      created_at: expense.created_at,
      updated_at: expense.updated_at,
      deleted_at: expense.deleted_at,
    };
  }

  /**
   * Mapea un objeto TripExpense a TripExpenseDTO
   */
  private mapTripExpenseToDTO(expense: TripExpense): TripExpenseDTO {
    return {
      id: expense.id,
      category: expense.category,
      amount: expense.amount,
      currency: expense.currency,
      description: expense.description,
      receipt_number: expense.receipt_number,
      notes: expense.notes,
      payment_status: expense.payment_status,
      payment_date: expense.payment_date,
      trip_id: expense.trip_id,
      created_by_id: expense.created_by_id,
      created_at: expense.created_at,
      updated_at: expense.updated_at,
      deleted_at: expense.deleted_at,
    };
  }
}

export default ExpenseService;
