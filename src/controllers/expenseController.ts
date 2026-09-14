import { Response } from 'express';

import {

  AuthenticatedRequest,

  CreateCompanyExpenseInput,

  UpdateCompanyExpenseInput,

  CreateTripExpenseInput,

  UpdateTripExpenseInput,

  TripExpenseCategoryEnum,

} from '../types/index';

import { BaseController } from './baseController';

import ExpenseService from '../services/expenseService';



/**

 * ExpenseController

 * Maneja las operaciones HTTP para dos tipos de gastos completamente separados:

 * 1. CompanyExpense: Gastos estructurales de la empresa

 * 2. TripExpense: Gastos asociados a viajes específicos

 *

 * Separation of concerns: Controller solo gestiona HTTP, ExpenseService maneja lógica

 */

export class ExpenseController extends BaseController {

  private expenseService: ExpenseService;



  constructor() {

    super();

    this.expenseService = new ExpenseService();

  }



  // ==================== COMPANY EXPENSE ENDPOINTS ====================



  /**

   * POST /expenses/company

   * Crea un nuevo gasto de empresa

   */

    async createCompanyExpense(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user?.id) {
        this.sendError(res, 'Unauthorized: User not authenticated', 401, undefined, req);
        return;
      }

      const { name, description, category, amount, currency, expense_date, due_date, is_recurring, recurrence_period, invoice_number, notes } = req.body;

      const errors: Record<string, string[]> = {};

      if (!name || typeof name !== 'string' || name.trim() === '') {
        errors.name = ['Name is required and must be a non-empty string'];
      }

      if (!category || typeof category !== 'string' || category.trim() === '') {
        errors.category = ['Category is required and must be a non-empty string'];
      }

      if (!amount || typeof amount !== 'number' || amount <= 0) {
        errors.amount = ['Amount is required, must be a number and greater than 0'];
      }

      if (Object.keys(errors).length > 0) {
        this.sendError(res, 'Validation failed', 400, errors, req);
        return;
      }

      // Parse expense_date: viene como string YYYY-MM-DD del frontend
      const expenseDate = expense_date ? new Date(expense_date) : new Date();

      const input: CreateCompanyExpenseInput = {
        name,
        category,
        amount,
        description: description ?? undefined,
        currency: currency ?? 'USD',
        expense_date: expenseDate,
        due_date: due_date ? new Date(due_date) : undefined,
        is_recurring: is_recurring ?? false,
        recurrence_period: recurrence_period ?? undefined,
        invoice_number: invoice_number ?? undefined,
        notes: notes ?? undefined,
        created_by_id: req.user.id,
        payment_status: 'PAID',
      };

      const result = await this.expenseService.createCompanyExpense(input);



      if (!result.success) {

        this.sendError(res, result.message, 400, undefined, req);

        return;

      }



      this.sendSuccess(res, result.data, 'Company expense created successfully', 201, req);

    } catch (error) {

      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

      this.sendError(res, `Failed to create company expense: ${errorMessage}`, 500, undefined, req);

    }

  }



  /**

   * GET /expenses/company

   * Obtiene todos los gastos de empresa (paginado)

   */

  async getCompanyExpenses(req: AuthenticatedRequest, res: Response): Promise<void> {

    try {

      const { page, limit } = this.getPaginationParams(req);



      const result = await this.expenseService.getCompanyExpenses(page, limit);



      if (!result.success) {

        this.sendError(res, result.message, 404, undefined, req);

        return;

      }



      const { data, total, totalPages } = result.data!;

      this.sendPaginatedSuccess(res, data, total, page, limit, 'Company expenses retrieved successfully', 200, req);

    } catch (error) {

      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

      this.sendError(res, `Failed to retrieve company expenses: ${errorMessage}`, 500, undefined, req);

    }

  }



  /**

   * GET /expenses/company/:id

   * Obtiene un gasto de empresa por ID

   */

  async getCompanyExpenseById(req: AuthenticatedRequest, res: Response): Promise<void> {

    try {

      const { id } = req.params;



      if (!id || typeof id !== 'string') {

        this.sendError(res, 'Company expense ID is required and must be a string', 400, undefined, req);

        return;

      }



      const result = await this.expenseService.getCompanyExpenseById(id);



      if (!result.success) {

        this.sendError(res, result.message, 404, undefined, req);

        return;

      }



      this.sendSuccess(res, result.data, 'Company expense retrieved successfully', 200, req);

    } catch (error) {

      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

      this.sendError(res, `Failed to retrieve company expense: ${errorMessage}`, 500, undefined, req);

    }

  }



  /**

   * GET /expenses/company/category/:category

   * Obtiene gastos de empresa por categoría

   */

  async getCompanyExpensesByCategory(req: AuthenticatedRequest, res: Response): Promise<void> {

    try {

      const { category } = req.params;

      const { page, limit } = this.getPaginationParams(req);



      if (!category || typeof category !== 'string') {

        this.sendError(res, 'Category is required and must be a string', 400, undefined, req);

        return;

      }



      const result = await this.expenseService.getCompanyExpensesByCategory(category, page, limit);



      if (!result.success) {

        this.sendError(res, result.message, 404, undefined, req);

        return;

      }



      const { data, total, totalPages } = result.data!;

      this.sendPaginatedSuccess(res, data, total, page, limit, 'Company expenses by category retrieved successfully', 200, req);

    } catch (error) {

      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

      this.sendError(res, `Failed to retrieve company expenses by category: ${errorMessage}`, 500, undefined, req);

    }

  }



  /**

   * GET /expenses/company/recurring

   * Obtiene gastos recurrentes de empresa

   */

  async getRecurringCompanyExpenses(req: AuthenticatedRequest, res: Response): Promise<void> {

    try {

      const { page, limit } = this.getPaginationParams(req);



      const result = await this.expenseService.getRecurringCompanyExpenses(page, limit);



      if (!result.success) {

        this.sendError(res, result.message, 404, undefined, req);

        return;

      }



      const { data, total, totalPages } = result.data!;

      this.sendPaginatedSuccess(res, data, total, page, limit, 'Recurring company expenses retrieved successfully', 200, req);

    } catch (error) {

      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

      this.sendError(res, `Failed to retrieve recurring company expenses: ${errorMessage}`, 500, undefined, req);

    }

  }



  /**

   * PUT /expenses/company/:id

   * Actualiza un gasto de empresa

   */

    async updateCompanyExpense(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { name, description, category, amount, currency, expense_date, due_date, is_recurring, recurrence_period, invoice_number, notes } = req.body;

      if (!id || typeof id !== 'string') {
        this.sendError(res, 'Company expense ID is required and must be a string', 400, undefined, req);
        return;
      }

      const errors: Record<string, string[]> = {};

      if (amount !== undefined && (typeof amount !== 'number' || amount <= 0)) {
        errors.amount = ['Amount must be a number and greater than 0'];
      }

      if (name !== undefined && (typeof name !== 'string' || name.trim() === '')) {
        errors.name = ['Name must be a non-empty string'];
      }

      if (category !== undefined && (typeof category !== 'string' || category.trim() === '')) {
        errors.category = ['Category must be a non-empty string'];
      }

      if (Object.keys(errors).length > 0) {
        this.sendError(res, 'Validation failed', 400, errors, req);
        return;
      }

      // Parse expense_date: viene como string YYYY-MM-DD del frontend
      const expenseDate = expense_date ? new Date(expense_date) : undefined;

      const input: UpdateCompanyExpenseInput = {
        name,
        description,
        category,
        amount,
        currency,
        expense_date: expenseDate,
        due_date: due_date ? new Date(due_date) : undefined,
        is_recurring,
        recurrence_period,
        payment_status: 'PAID',
        payment_date: new Date(),
        invoice_number,
        notes,
      };

      const result = await this.expenseService.updateCompanyExpense(id, input);



      if (!result.success) {

        this.sendError(res, result.message, 404, undefined, req);

        return;

      }



      this.sendSuccess(res, result.data, 'Company expense updated successfully', 200, req);

    } catch (error) {

      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

      this.sendError(res, `Failed to update company expense: ${errorMessage}`, 500, undefined, req);

    }

  }



  /**

   * PATCH /expenses/company/:id/pay

   * Marca un gasto de empresa como pagado

   */

  async markCompanyExpenseAsPaid(req: AuthenticatedRequest, res: Response): Promise<void> {

    try {

      const { id } = req.params;

      const { paymentDate } = req.body;



      if (!id || typeof id !== 'string') {

        this.sendError(res, 'Company expense ID is required and must be a string', 400, undefined, req);

        return;

      }



      const payDate = paymentDate ? new Date(paymentDate) : undefined;



      const result = await this.expenseService.markCompanyExpenseAsPaid(id, payDate);



      if (!result.success) {

        this.sendError(res, result.message, 404, undefined, req);

        return;

      }



      this.sendSuccess(res, result.data, 'Company expense marked as paid', 200, req);

    } catch (error) {

      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

      this.sendError(res, `Failed to mark company expense as paid: ${errorMessage}`, 500, undefined, req);

    }

  }



  /**

   * GET /expenses/company/report

   * Obtiene reporte de gastos de empresa en un período

   */

  async getCompanyExpenseReport(req: AuthenticatedRequest, res: Response): Promise<void> {

    try {

      const { startDate, endDate } = req.query;



      if (!startDate || typeof startDate !== 'string') {

        this.sendError(res, 'Start date is required and must be a valid date string', 400, undefined, req);

        return;

      }



      if (!endDate || typeof endDate !== 'string') {

        this.sendError(res, 'End date is required and must be a valid date string', 400, undefined, req);

        return;

      }



      const startDateObj = new Date(startDate);

      const endDateObj = new Date(endDate);



      if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {

        this.sendError(res, 'Invalid date format. Use ISO 8601 format (YYYY-MM-DD)', 400, undefined, req);

        return;

      }



      const result = await this.expenseService.getCompanyExpenseReport(startDateObj, endDateObj);



      if (!result.success) {

        this.sendError(res, result.message, 404, undefined, req);

        return;

      }



      this.sendSuccess(res, result.data, 'Company expense report retrieved successfully', 200, req);

    } catch (error) {

      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

      this.sendError(res, `Failed to retrieve company expense report: ${errorMessage}`, 500, undefined, req);

    }

  }



  /**

   * DELETE /expenses/company/:id

   * Elimina un gasto de empresa

   */

  async deleteCompanyExpense(req: AuthenticatedRequest, res: Response): Promise<void> {

    try {

      const { id } = req.params;



      if (!id || typeof id !== 'string') {

        this.sendError(res, 'Company expense ID is required and must be a string', 400, undefined, req);

        return;

      }



      const result = await this.expenseService.deleteCompanyExpense(id);



      if (!result.success) {

        this.sendError(res, result.message, 404, undefined, req);

        return;

      }



      this.sendSuccess(res, null, 'Company expense deleted successfully', 200, req);

    } catch (error) {

      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

      this.sendError(res, `Failed to delete company expense: ${errorMessage}`, 500, undefined, req);

    }

  }



  // ==================== TRIP EXPENSE ENDPOINTS ====================



  /**

   * POST /expenses/trip

   * Crea un nuevo gasto de viaje

   */

  async createTripExpense(req: AuthenticatedRequest, res: Response): Promise<void> {

    try {

      if (!req.user?.id) {

        this.sendError(res, 'Unauthorized: User not authenticated', 401, undefined, req);

        return;

      }



      const { trip_id, category, amount, currency, description, receipt_number, notes } = req.body;



      const errors: Record<string, string[]> = {};



      if (!trip_id || typeof trip_id !== 'string') {

        errors.trip_id = ['Trip ID is required and must be a string'];

      }



      if (!category || typeof category !== 'string' || !Object.values(TripExpenseCategoryEnum).includes(category as TripExpenseCategoryEnum)) {

        errors.category = [`Category is required and must be one of: ${Object.values(TripExpenseCategoryEnum).join(', ')}`];

      }



      if (!amount || typeof amount !== 'number' || amount <= 0) {

        errors.amount = ['Amount is required, must be a number and greater than 0'];

      }



      if (Object.keys(errors).length > 0) {

        this.sendError(res, 'Validation failed', 400, errors, req);

        return;

      }



      const input: CreateTripExpenseInput = {

        trip_id,

        category: category as TripExpenseCategoryEnum,

        amount,

        currency: currency ?? 'USD',

        description: description ?? undefined,

        receipt_number: receipt_number ?? undefined,

        notes: notes ?? undefined,

        created_by_id: req.user.id,

      };



      const result = await this.expenseService.createTripExpense(input);



      if (!result.success) {

        this.sendError(res, result.message, 400, undefined, req);

        return;

      }



      this.sendSuccess(res, result.data, 'Trip expense created successfully', 201, req);

    } catch (error) {

      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

      this.sendError(res, `Failed to create trip expense: ${errorMessage}`, 500, undefined, req);

    }

  }



  /**

   * GET /expenses/trip/:tripId

   * Obtiene todos los gastos de un viaje específico

   */

  async getTripExpensesByTrip(req: AuthenticatedRequest, res: Response): Promise<void> {

    try {

      const { tripId } = req.params;

      const { page, limit } = this.getPaginationParams(req);



      if (!tripId || typeof tripId !== 'string') {

        this.sendError(res, 'Trip ID is required and must be a string', 400, undefined, req);

        return;

      }



      const result = await this.expenseService.getTripExpensesByTrip(tripId, page, limit);



      if (!result.success) {

        this.sendError(res, result.message, 404, undefined, req);

        return;

      }



      const { data, total, totalPages } = result.data!;

      this.sendPaginatedSuccess(res, data, total, page, limit, 'Trip expenses retrieved successfully', 200, req);

    } catch (error) {

      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

      this.sendError(res, `Failed to retrieve trip expenses: ${errorMessage}`, 500, undefined, req);

    }

  }



  /**

   * GET /expenses/trip-expense/:id

   * Obtiene un gasto de viaje por ID

   */

  async getTripExpenseById(req: AuthenticatedRequest, res: Response): Promise<void> {

    try {

      const { id } = req.params;



      if (!id || typeof id !== 'string') {

        this.sendError(res, 'Trip expense ID is required and must be a string', 400, undefined, req);

        return;

      }



      const result = await this.expenseService.getTripExpenseById(id);



      if (!result.success) {

        this.sendError(res, result.message, 404, undefined, req);

        return;

      }



      this.sendSuccess(res, result.data, 'Trip expense retrieved successfully', 200, req);

    } catch (error) {

      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

      this.sendError(res, `Failed to retrieve trip expense: ${errorMessage}`, 500, undefined, req);

    }

  }



  /**

   * PUT /expenses/trip-expense/:id

   * Actualiza un gasto de viaje

   */

  async updateTripExpense(req: AuthenticatedRequest, res: Response): Promise<void> {

    try {

      const { id } = req.params;

      const { category, amount, currency, description, receipt_number, notes, payment_status, payment_date } = req.body;



      if (!id || typeof id !== 'string') {

        this.sendError(res, 'Trip expense ID is required and must be a string', 400, undefined, req);

        return;

      }



      const errors: Record<string, string[]> = {};



      if (amount !== undefined && (typeof amount !== 'number' || amount <= 0)) {

        errors.amount = ['Amount must be a number and greater than 0'];

      }



      if (category !== undefined && (typeof category !== 'string' || !Object.values(TripExpenseCategoryEnum).includes(category as TripExpenseCategoryEnum))) {
        errors.category = [`Category must be one of: ${Object.values(TripExpenseCategoryEnum).join(', ')}`];

      }



      if (Object.keys(errors).length > 0) {

        this.sendError(res, 'Validation failed', 400, errors, req);

        return;

      }



      const input: UpdateTripExpenseInput = {

        category: category as TripExpenseCategoryEnum,

        amount,

        currency,

        description,

        receipt_number,

        notes,

        payment_status,

        payment_date: payment_date ? new Date(payment_date) : undefined,

      };



      const result = await this.expenseService.updateTripExpense(id, input);



      if (!result.success) {

        this.sendError(res, result.message, 404, undefined, req);

        return;

      }



      this.sendSuccess(res, result.data, 'Trip expense updated successfully', 200, req);

    } catch (error) {

      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

      this.sendError(res, `Failed to update trip expense: ${errorMessage}`, 500, undefined, req);

    }

  }



  /**

   * PATCH /expenses/trip-expense/:id/pay

   * Marca un gasto de viaje como pagado

   */

  async markTripExpenseAsPaid(req: AuthenticatedRequest, res: Response): Promise<void> {

    try {

      const { id } = req.params;

      const { paymentDate } = req.body;



      if (!id || typeof id !== 'string') {

        this.sendError(res, 'Trip expense ID is required and must be a string', 400, undefined, req);

        return;

      }



      const payDate = paymentDate ? new Date(paymentDate) : undefined;



      const result = await this.expenseService.markTripExpenseAsPaid(id, payDate);



      if (!result.success) {

        this.sendError(res, result.message, 404, undefined, req);

        return;

      }



      this.sendSuccess(res, result.data, 'Trip expense marked as paid', 200, req);

    } catch (error) {

      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

      this.sendError(res, `Failed to mark trip expense as paid: ${errorMessage}`, 500, undefined, req);

    }

  }



  /**

   * GET /expenses/trip/:tripId/total

   * Calcula el total de gastos de un viaje

   */

  async getTripExpensesTotal(req: AuthenticatedRequest, res: Response): Promise<void> {

    try {

      const { tripId } = req.params;



      if (!tripId || typeof tripId !== 'string') {

        this.sendError(res, 'Trip ID is required and must be a string', 400, undefined, req);

        return;

      }



      const result = await this.expenseService.getTripExpensesTotal(tripId);



      if (!result.success) {

        this.sendError(res, result.message, 404, undefined, req);

        return;

      }



      this.sendSuccess(res, result.data, 'Trip expenses total calculated successfully', 200, req);

    } catch (error) {

      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

      this.sendError(res, `Failed to calculate trip expenses total: ${errorMessage}`, 500, undefined, req);

    }

  }



  /**

   * DELETE /expenses/trip-expense/:id

   * Elimina un gasto de viaje

   */

  async deleteTripExpense(req: AuthenticatedRequest, res: Response): Promise<void> {

    try {

      const { id } = req.params;



      if (!id || typeof id !== 'string') {

        this.sendError(res, 'Trip expense ID is required and must be a string', 400, undefined, req);

        return;

      }



      const result = await this.expenseService.deleteTripExpense(id);



      if (!result.success) {

        this.sendError(res, result.message, 404, undefined, req);

        return;

      }



      this.sendSuccess(res, null, 'Trip expense deleted successfully', 200, req);

    } catch (error) {

      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

      this.sendError(res, `Failed to delete trip expense: ${errorMessage}`, 500, undefined, req);

    }

  }

}



export default ExpenseController;

