import { BaseService } from './baseService';
import { ServiceResponse } from '../types/index';
import bcrypt = require('bcrypt');
import jwt = require('jsonwebtoken');
import { Prisma } from '@prisma/client';

interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  role?: string;
}

interface UpdateUserInput {
  name?: string;
  email?: string;
  role?: string;
}

interface LoginInput {
  email: string;
  password: string;
}

interface UserWithoutPassword {
  id: string;
  name: string;
  email: string;
  role: string;
  created_at: Date;
  updated_at: Date;
}

interface LoginResponse {
  user: UserWithoutPassword;
  token: string;
}

/**
 * UserService
 * Contiene la lógica de negocio para usuarios
 */
export class UserService extends BaseService {
  private readonly SALT_ROUNDS = 10;
  private readonly JWT_SECRET: string;
  private readonly JWT_EXPIRY: string;

  constructor() {
    super();
    
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET environment variable is required');
    }
    
    this.JWT_SECRET = jwtSecret;
    this.JWT_EXPIRY = process.env.JWT_EXPIRY || '7d';
  }

  async createUser(userData: CreateUserInput): Promise<ServiceResponse<UserWithoutPassword>> {
    try {
      const { name, email, password, role = 'DISPATCHER' } = userData;

      // Validar que el usuario no exista
      const existingUser = await this.prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        return this.createErrorResponse('User with this email already exists') as unknown as ServiceResponse<UserWithoutPassword>;
      }

      // Hash de la contraseña
      const password_hash = await bcrypt.hash(password, this.SALT_ROUNDS);

      // Crear usuario
      const user = await this.prisma.user.create({
        data: {
          name,
          email,
          password_hash,
          role: role as any,
        },
      });

      return this.createSuccessResponse(this.stripPassword(user), 'User created successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create user';
      return this.createErrorResponse(message) as unknown as ServiceResponse<UserWithoutPassword>;
    }
  }

  async getUsers(page: number, limit: number): Promise<ServiceResponse<any>> {
    try {
      const { skip, take } = this.calculatePagination(page, limit);

      // Obtener usuarios activos (deleted_at es null)
      const [users, total] = await Promise.all([
        this.prisma.user.findMany({
          where: {
            deleted_at: null,
          },
          skip,
          take,
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            created_at: true,
            updated_at: true,
          },
          orderBy: {
            created_at: 'desc',
          },
        }),
        this.prisma.user.count({
          where: {
            deleted_at: null,
          },
        }),
      ]);

      return this.createSuccessResponse(
        {
          users,
          pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
          },
        },
        'Users retrieved successfully'
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to retrieve users';
      return this.createErrorResponse(message);
    }
  }

  async getUserById(id: string): Promise<ServiceResponse<UserWithoutPassword>> {
    try {
      if (!this.isValidId(id)) {
        return this.createErrorResponse('Invalid user ID format') as unknown as ServiceResponse<UserWithoutPassword>;
      }

      const user = await this.prisma.user.findUnique({
        where: { id },
      });

      if (!user || user.deleted_at !== null) {
        return this.createErrorResponse('User not found') as unknown as ServiceResponse<UserWithoutPassword>;
      }

      return this.createSuccessResponse(this.stripPassword(user), 'User retrieved successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to retrieve user';
      return this.createErrorResponse(message) as unknown as ServiceResponse<UserWithoutPassword>;
    }
  }

  async updateUser(id: string, userData: UpdateUserInput): Promise<ServiceResponse<UserWithoutPassword>> {
    try {
      if (!this.isValidId(id)) {
        return this.createErrorResponse('Invalid user ID format') as unknown as ServiceResponse<UserWithoutPassword>;
      }

      const existingUser = await this.prisma.user.findUnique({
        where: { id },
      });

      if (!existingUser || existingUser.deleted_at !== null) {
        return this.createErrorResponse('User not found') as unknown as ServiceResponse<UserWithoutPassword>;
      }

      // Si se intenta cambiar el email, validar que no exista otro usuario con ese email
      if (userData.email && userData.email !== existingUser.email) {
        const emailExists = await this.prisma.user.findUnique({
          where: { email: userData.email },
        });
        if (emailExists) {
          return this.createErrorResponse('Email already in use') as unknown as ServiceResponse<UserWithoutPassword>;
        }
      }

      const updateData: Prisma.UserUpdateInput = {};
      if (userData.name) updateData.name = userData.name;
      if (userData.email) updateData.email = userData.email;
      if (userData.role) updateData.role = userData.role as any;

      const updatedUser = await this.prisma.user.update({
        where: { id },
        data: updateData,
      });

      return this.createSuccessResponse(this.stripPassword(updatedUser), 'User updated successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update user';
      return this.createErrorResponse(message) as unknown as ServiceResponse<UserWithoutPassword>;
    }
  }

  async deleteUser(id: string): Promise<ServiceResponse<null>> {
    try {
      if (!this.isValidId(id)) {
        return this.createErrorResponse('Invalid user ID format');
      }

      const existingUser = await this.prisma.user.findUnique({
        where: { id },
      });

      if (!existingUser || existingUser.deleted_at !== null) {
        return this.createErrorResponse('User not found');
      }

      // Borrado lógico
      await this.prisma.user.update({
        where: { id },
        data: {
          deleted_at: new Date(),
        },
      });

      return this.createSuccessResponse(null, 'User deleted successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete user';
      return this.createErrorResponse(message);
    }
  }

  async changePassword(
    id: string,
    currentPassword: string,
    newPassword: string
  ): Promise<ServiceResponse<null>> {
    try {
      if (!this.isValidId(id)) {
        return this.createErrorResponse('Invalid user ID format');
      }

      const user = await this.prisma.user.findUnique({
        where: { id },
      });

      if (!user || user.deleted_at !== null) {
        return this.createErrorResponse('User not found');
      }

      // Verificar contraseña actual
      const passwordMatch = await bcrypt.compare(currentPassword, user.password_hash);
      if (!passwordMatch) {
        return this.createErrorResponse('Current password is incorrect');
      }

      // Hash de la nueva contraseña
      const newPasswordHash = await bcrypt.hash(newPassword, this.SALT_ROUNDS);

      // Actualizar contraseña
      await this.prisma.user.update({
        where: { id },
        data: {
          password_hash: newPasswordHash,
        },
      });

      return this.createSuccessResponse(null, 'Password changed successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to change password';
      return this.createErrorResponse(message);
    }
  }

  async getUserByEmail(email: string): Promise<ServiceResponse<UserWithoutPassword>> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { email },
      });

      if (!user || user.deleted_at !== null) {
        return this.createErrorResponse('User not found') as unknown as ServiceResponse<UserWithoutPassword>;
      }

      return this.createSuccessResponse(this.stripPassword(user), 'User retrieved successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to retrieve user';
      return this.createErrorResponse(message) as unknown as ServiceResponse<UserWithoutPassword>;
    }
  }

  async login(loginData: LoginInput): Promise<ServiceResponse<LoginResponse>> {
    try {
      const { email, password } = loginData;

      // Encontrar usuario por email
      const user = await this.prisma.user.findUnique({
        where: { email },
      });

      if (!user || user.deleted_at !== null) {
        return this.createErrorResponse('Invalid email or password') as unknown as ServiceResponse<LoginResponse>;
      }

      // Verificar contraseña
      const passwordMatch = await bcrypt.compare(password, user.password_hash);
      if (!passwordMatch) {
        return this.createErrorResponse('Invalid email or password') as unknown as ServiceResponse<LoginResponse>;
      }

      // Generar JWT
      const token = jwt.sign(
        {
          id: user.id,
          email: user.email,
          role: user.role,
        },
        this.JWT_SECRET,
        {
          expiresIn: this.JWT_EXPIRY,
        }
      );

      return this.createSuccessResponse(
        {
          user: this.stripPassword(user),
          token,
        },
        'Login successful'
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed';
      return this.createErrorResponse(message) as unknown as ServiceResponse<LoginResponse>;
    }
  }

  /**
   * Elimina la contraseña de la respuesta del usuario
   */
  private stripPassword(user: any): UserWithoutPassword {
    const { password_hash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}

export default UserService;
