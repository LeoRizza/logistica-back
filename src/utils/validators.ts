/**
 * Funciones de validación reutilizables
 */

export const validators = {
  /**
   * Valida que un email sea válido
   */
  isValidEmail: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  /**
   * Valida que una contraseña tenga los requisitos mínimos
   * Al menos 8 caracteres, una mayúscula, una minúscula y un número
   */
  isValidPassword: (password: string): boolean => {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
  },

  /**
   * Valida que un número de teléfono sea válido
   */
  isValidPhoneNumber: (phone: string): boolean => {
    const phoneRegex = /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/;
    return phoneRegex.test(phone);
  },

  /**
   * Valida que una placa de vehículo sea válida
   */
  isValidPlate: (plate: string): boolean => {
    // Formato: XXX-XXX (letras-números) o similar según país
    const plateRegex = /^[A-Z]{2,3}-[0-9]{3,4}$/i;
    return plateRegex.test(plate);
  },

  /**
   * Valida que un número sea entero positivo
   */
  isPositiveInteger: (num: number): boolean => {
    return Number.isInteger(num) && num > 0;
  },

  /**
   * Valida que un número sea positivo (puede tener decimales)
   */
  isPositiveNumber: (num: number): boolean => {
    return typeof num === 'number' && num > 0;
  },

  /**
   * Valida que una cadena no esté vacía
   */
  isNotEmpty: (str: string | null | undefined): boolean => {
    return typeof str === 'string' && str.trim().length > 0;
  },

  /**
   * Valida que una fecha sea válida y en el futuro (para fechas de expiración)
   */
  isValidFutureDate: (date: Date | string): boolean => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj instanceof Date && !isNaN(dateObj.getTime()) && dateObj > new Date();
  },

  /**
   * Valida que una fecha sea válida
   */
  isValidDate: (date: Date | string): boolean => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj instanceof Date && !isNaN(dateObj.getTime());
  },

  /**
   * Valida que una cadena tenga una longitud específica
   */
  hasLength: (str: string, min: number, max?: number): boolean => {
    if (!str) {
      return false;
    }
    if (max === undefined) {
      return str.length >= min;
    }
    return str.length >= min && str.length <= max;
  },

  /**
   * Valida que un UUID sea válido
   */
  isValidUUID: (uuid: string): boolean => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  },

  /**
   * Valida que un número de licencia sea válido (formato básico)
   */
  isValidLicenseNumber: (license: string): boolean => {
    // Acepta formatos alfanuméricos básicos
    return /^[A-Z0-9]{6,12}$/i.test(license);
  },
};

export default validators;

