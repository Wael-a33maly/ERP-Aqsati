import { z } from 'zod';

/**
 * Common validation schemas
 */
export const schemas = {
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().regex(/^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/, 'Invalid phone number').optional().or(z.literal('')),
  cuid: z.string().regex(/^c[a-z0-9]{24}$/, 'Invalid ID format'),
  code: z.string().min(1, 'Code is required').max(20, 'Code must be 20 characters or less'),
};

/**
 * Login validation schema
 */
export const loginSchema = z.object({
  email: schemas.email,
  password: z.string().min(1, 'Password is required'),
});

/**
 * Register validation schema
 */
export const registerSchema = z.object({
  email: schemas.email,
  password: schemas.password,
  name: schemas.name,
  nameAr: z.string().optional(),
  phone: z.string().optional(),
  role: z.enum(['SUPER_ADMIN', 'COMPANY_ADMIN', 'BRANCH_MANAGER', 'AGENT', 'COLLECTOR']).optional(),
  companyId: z.string().optional(),
  branchId: z.string().optional(),
});

/**
 * Company validation schema
 */
export const companySchema = z.object({
  name: schemas.name,
  nameAr: z.string().optional(),
  code: schemas.code,
  logo: z.string().url().optional().or(z.literal('')),
  email: schemas.email.optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  taxNumber: z.string().optional(),
  active: z.boolean().optional(),
});

/**
 * Branch validation schema
 */
export const branchSchema = z.object({
  companyId: schemas.cuid,
  name: schemas.name,
  nameAr: z.string().optional(),
  code: schemas.code,
  address: z.string().optional(),
  phone: z.string().optional(),
  active: z.boolean().optional(),
  isMain: z.boolean().optional(),
});

/**
 * User validation schema
 */
export const userSchema = z.object({
  email: schemas.email,
  password: schemas.password.optional(),
  name: schemas.name,
  nameAr: z.string().optional(),
  phone: z.string().optional(),
  avatar: z.string().url().optional().or(z.literal('')),
  role: z.enum(['SUPER_ADMIN', 'COMPANY_ADMIN', 'BRANCH_MANAGER', 'AGENT', 'COLLECTOR']),
  companyId: z.string().optional(),
  branchId: z.string().optional(),
  active: z.boolean().optional(),
});

/**
 * User update validation schema (without password)
 */
export const userUpdateSchema = userSchema.omit({ password: true });

/**
 * Validate data against a schema
 */
export function validate<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; errors: string[] } {
  const result = schema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  }
  
  const errors = result.error.errors.map((err) => `${err.path.join('.')}: ${err.message}`);
  return { success: false, errors };
}

/**
 * Validate request body
 */
export async function validateBody<T>(schema: z.ZodSchema<T>, request: Request): Promise<{ success: true; data: T } | { success: false; errors: string[] }> {
  try {
    const body = await request.json();
    return validate(schema, body);
  } catch {
    return { success: false, errors: ['Invalid JSON body'] };
  }
}
