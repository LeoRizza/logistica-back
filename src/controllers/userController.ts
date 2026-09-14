import { Response } from 'express';
import { AuthenticatedRequest } from '../types/index';
import { BaseController } from './baseController';
import { UserService } from '../services/userService';
import { validators } from '../utils/validators';

/**
 * UserController
 * Maneja las operaciones relacionadas con usuarios
 */
export class UserController extends BaseController {
  private userService = new UserService();

  /**
   * POST /users - Crear un nuevo usuario
   */
  async createUser(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { name, email, password, role } = req.body;

      // Validaciones básicas
      if (!name || !email || !password) {
        this.sendError(
          res,
          'Missing required fields: name, email, password',
          400,
          {
            name: !name ? ['Name is required'] : [],
            email: !email ? ['Email is required'] : [],
            password: !password ? ['Password is required'] : [],
          },
          req
        );
        return;
      }

      // Validar formato de email
      if (!validators.isValidEmail(email)) {
        this.sendError(
          res,
          'Invalid email format',
          400,
          { email: ['Invalid email format'] },
          req
        );
        return;
      }

      // Validar contraseña
      if (!validators.isValidPassword(password)) {
        this.sendError(
          res,
          'Password must be at least 8 characters with uppercase, lowercase, and number',
          400,
          {
            password: [
              'Password must be at least 8 characters',
              'Must contain uppercase letter',
              'Must contain lowercase letter',
              'Must contain number',
            ],
          },
          req
        );
        return;
      }

      // Validar nombre
      if (!validators.isNotEmpty(name)) {
        this.sendError(
          res,
          'Name cannot be empty',
          400,
          { name: ['Name cannot be empty'] },
          req
        );
        return;
      }

      // Llamar al servicio
      const response = await this.userService.createUser({
        name,
        email,
        password,
        role,
      });

      if (!response.success) {
        this.sendError(res, response.message, 400, undefined, req);
        return;
      }

      this.sendSuccess(res, response.data, response.message, 201, req);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Internal server error';
      this.sendError(res, message, 500, undefined, req);
    }
  }

  /**
   * GET /users - Obtener lista de usuarios con paginación
   */
  async getUsers(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { page, limit } = this.getPaginationParams(req);

      const response = await this.userService.getUsers(page, limit);

      if (!response.success) {
        this.sendError(res, response.message, 400, undefined, req);
        return;
      }

      const { users, pagination } = response.data as any;

      this.sendPaginatedSuccess(
        res,
        users,
        pagination.total,
        pagination.page,
        pagination.limit,
        response.message,
        200,
        req
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Internal server error';
      this.sendError(res, message, 500, undefined, req);
    }
  }

  /**
   * GET /users/:id - Obtener usuario por ID
   */
  async getUserById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

      if (!id) {
        this.sendError(res, 'User ID is required', 400, { id: ['User ID is required'] }, req);
        return;
      }

      const response = await this.userService.getUserById(id);

      if (!response.success) {
        this.sendError(res, response.message, 404, undefined, req);
        return;
      }

      this.sendSuccess(res, response.data, response.message, 200, req);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Internal server error';
      this.sendError(res, message, 500, undefined, req);
    }
  }

  /**
   * PUT /users/:id - Actualizar usuario
   */
  async updateUser(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const { name, email, role } = req.body;

      if (!id) {
        this.sendError(res, 'User ID is required', 400, { id: ['User ID is required'] }, req);
        return;
      }

      const errors: Record<string, string[]> = {};

      // Validar email si se proporciona
      if (email && !validators.isValidEmail(email)) {
        errors.email = ['Invalid email format'];
      }

      // Validar nombre si se proporciona
      if (name !== undefined && name !== null && !validators.isNotEmpty(name)) {
        errors.name = ['Name cannot be empty'];
      }

      if (Object.keys(errors).length > 0) {
        this.sendError(res, 'Validation failed', 400, errors, req);
        return;
      }

      const response = await this.userService.updateUser(id, {
        name,
        email,
        role,
      });

      if (!response.success) {
        this.sendError(res, response.message, 400, undefined, req);
        return;
      }

      this.sendSuccess(res, response.data, response.message, 200, req);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Internal server error';
      this.sendError(res, message, 500, undefined, req);
    }
  }

  /**
   * DELETE /users/:id - Eliminar usuario (borrado lógico)
   */
  async deleteUser(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

      if (!id) {
        this.sendError(res, 'User ID is required', 400, { id: ['User ID is required'] }, req);
        return;
      }

      const response = await this.userService.deleteUser(id);

      if (!response.success) {
        this.sendError(res, response.message, 404, undefined, req);
        return;
      }

      this.sendSuccess(res, null, response.message, 200, req);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Internal server error';
      this.sendError(res, message, 500, undefined, req);
    }
  }

  /**
   * PATCH /users/:id/change-password - Cambiar contraseña
   */
  async changePassword(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const { currentPassword, newPassword, confirmPassword } = req.body;

      if (!id) {
        this.sendError(res, 'User ID is required', 400, { id: ['User ID is required'] }, req);
        return;
      }

      const errors: Record<string, string[]> = {};

      if (!currentPassword) {
        errors.currentPassword = ['Current password is required'];
      }

      if (!newPassword) {
        errors.newPassword = ['New password is required'];
      }

      if (!confirmPassword) {
        errors.confirmPassword = ['Password confirmation is required'];
      }

      if (newPassword && confirmPassword && newPassword !== confirmPassword) {
        errors.passwordMatch = ['Passwords do not match'];
      }

      if (newPassword && !validators.isValidPassword(newPassword)) {
        errors.newPassword = [
          'Password must be at least 8 characters',
          'Must contain uppercase letter',
          'Must contain lowercase letter',
          'Must contain number',
        ];
      }

      if (Object.keys(errors).length > 0) {
        this.sendError(res, 'Validation failed', 400, errors, req);
        return;
      }

      const response = await this.userService.changePassword(id, currentPassword, newPassword);

      if (!response.success) {
        this.sendError(res, response.message, 400, undefined, req);
        return;
      }

      this.sendSuccess(res, null, response.message, 200, req);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Internal server error';
      this.sendError(res, message, 500, undefined, req);
    }
  }

  /**
   * POST /auth/login - Iniciar sesión
   */
  async login(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      const errors: Record<string, string[]> = {};

      if (!email) {
        errors.email = ['Email is required'];
      }

      if (!password) {
        errors.password = ['Password is required'];
      }

      if (Object.keys(errors).length > 0) {
        this.sendError(res, 'Validation failed', 400, errors, req);
        return;
      }

      const response = await this.userService.login({
        email,
        password,
      });

      if (!response.success) {
        this.sendError(res, response.message, 401, undefined, req);
        return;
      }

      this.sendSuccess(res, response.data, response.message, 200, req);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Internal server error';
      this.sendError(res, message, 500, undefined, req);
    }
  }
}

export default UserController;

