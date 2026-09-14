import { Router } from 'express';
import ExpenseController from '../controllers/expenseController';
import { asyncHandler } from '../middleware/asyncHandler';

const router: Router = Router();
const expenseController = new ExpenseController();

/**
 * Company Expense Routes
 * Gestión de gastos estructurales de la empresa
 */

// Create company expense
router.post(
  '/company',
  asyncHandler((req, res) => expenseController.createCompanyExpense(req, res))
);

// Get all company expenses
router.get(
  '/company',
  asyncHandler((req, res) => expenseController.getCompanyExpenses(req, res))
);

// Get company expense by ID
router.get(
  '/company/:id',
  asyncHandler((req, res) => expenseController.getCompanyExpenseById(req, res))
);

// Get company expenses by category
router.get(
  '/company/category/:category',
  asyncHandler((req, res) => expenseController.getCompanyExpensesByCategory(req, res))
);

// Get recurring company expenses
router.get(
  '/company/recurring',
  asyncHandler((req, res) => expenseController.getRecurringCompanyExpenses(req, res))
);

// Get company expense report
router.get(
  '/company/report',
  asyncHandler((req, res) => expenseController.getCompanyExpenseReport(req, res))
);

// Update company expense
router.put(
  '/company/:id',
  asyncHandler((req, res) => expenseController.updateCompanyExpense(req, res))
);

// Mark company expense as paid
router.patch(
  '/company/:id/pay',
  asyncHandler((req, res) => expenseController.markCompanyExpenseAsPaid(req, res))
);

// Delete company expense
router.delete(
  '/company/:id',
  asyncHandler((req, res) => expenseController.deleteCompanyExpense(req, res))
);

/**
 * Trip Expense Routes
 * Gestión de gastos asociados a viajes específicos
 */

// Create trip expense
router.post(
  '/trip',
  asyncHandler((req, res) => expenseController.createTripExpense(req, res))
);

// Get trip expenses by trip ID
router.get(
  '/trip/:tripId',
  asyncHandler((req, res) => expenseController.getTripExpensesByTrip(req, res))
);

// Get trip expense by ID
router.get(
  '/trip-expense/:id',
  asyncHandler((req, res) => expenseController.getTripExpenseById(req, res))
);

// Get trip expenses total
router.get(
  '/trip/:tripId/total',
  asyncHandler((req, res) => expenseController.getTripExpensesTotal(req, res))
);

// Update trip expense
router.put(
  '/trip-expense/:id',
  asyncHandler((req, res) => expenseController.updateTripExpense(req, res))
);

// Mark trip expense as paid
router.patch(
  '/trip-expense/:id/pay',
  asyncHandler((req, res) => expenseController.markTripExpenseAsPaid(req, res))
);

// Delete trip expense
router.delete(
  '/trip-expense/:id',
  asyncHandler((req, res) => expenseController.deleteTripExpense(req, res))
);

export default router;
