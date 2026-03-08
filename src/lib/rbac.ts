import { AuthUser, getAuthPayload, getCurrentUser } from './auth';
import { db } from '@/lib/db';

// Role hierarchy for permission checks
const ROLE_HIERARCHY: Record<string, number> = {
  SUPER_ADMIN: 100,
  COMPANY_ADMIN: 80,
  BRANCH_MANAGER: 60,
  AGENT: 40,
  COLLECTOR: 20,
};

// Permission definitions
export const PERMISSIONS = {
  // Company permissions
  COMPANY_CREATE: 'COMPANY_CREATE',
  COMPANY_READ: 'COMPANY_READ',
  COMPANY_UPDATE: 'COMPANY_UPDATE',
  COMPANY_DELETE: 'COMPANY_DELETE',
  
  // Branch permissions
  BRANCH_CREATE: 'BRANCH_CREATE',
  BRANCH_READ: 'BRANCH_READ',
  BRANCH_UPDATE: 'BRANCH_UPDATE',
  BRANCH_DELETE: 'BRANCH_DELETE',
  
  // User permissions
  USER_CREATE: 'USER_CREATE',
  USER_READ: 'USER_READ',
  USER_UPDATE: 'USER_UPDATE',
  USER_DELETE: 'USER_DELETE',
  
  // Customer permissions
  CUSTOMER_CREATE: 'CUSTOMER_CREATE',
  CUSTOMER_READ: 'CUSTOMER_READ',
  CUSTOMER_UPDATE: 'CUSTOMER_UPDATE',
  CUSTOMER_DELETE: 'CUSTOMER_DELETE',
  
  // Product permissions
  PRODUCT_CREATE: 'PRODUCT_CREATE',
  PRODUCT_READ: 'PRODUCT_READ',
  PRODUCT_UPDATE: 'PRODUCT_UPDATE',
  PRODUCT_DELETE: 'PRODUCT_DELETE',
  
  // Invoice permissions
  INVOICE_CREATE: 'INVOICE_CREATE',
  INVOICE_READ: 'INVOICE_READ',
  INVOICE_UPDATE: 'INVOICE_UPDATE',
  INVOICE_DELETE: 'INVOICE_DELETE',
  
  // Payment permissions
  PAYMENT_CREATE: 'PAYMENT_CREATE',
  PAYMENT_READ: 'PAYMENT_READ',
  PAYMENT_UPDATE: 'PAYMENT_UPDATE',
  PAYMENT_DELETE: 'PAYMENT_DELETE',
  
  // Report permissions
  REPORT_READ: 'REPORT_READ',
  REPORT_EXPORT: 'REPORT_EXPORT',
  
  // Settings permissions
  SETTINGS_READ: 'SETTINGS_READ',
  SETTINGS_UPDATE: 'SETTINGS_UPDATE',
} as const;

// Role-Permission mapping
const ROLE_PERMISSIONS: Record<string, Set<string>> = {
  SUPER_ADMIN: new Set(Object.values(PERMISSIONS)),
  
  COMPANY_ADMIN: new Set([
    PERMISSIONS.COMPANY_READ,
    PERMISSIONS.BRANCH_CREATE,
    PERMISSIONS.BRANCH_READ,
    PERMISSIONS.BRANCH_UPDATE,
    PERMISSIONS.BRANCH_DELETE,
    PERMISSIONS.USER_CREATE,
    PERMISSIONS.USER_READ,
    PERMISSIONS.USER_UPDATE,
    PERMISSIONS.USER_DELETE,
    PERMISSIONS.CUSTOMER_CREATE,
    PERMISSIONS.CUSTOMER_READ,
    PERMISSIONS.CUSTOMER_UPDATE,
    PERMISSIONS.CUSTOMER_DELETE,
    PERMISSIONS.PRODUCT_CREATE,
    PERMISSIONS.PRODUCT_READ,
    PERMISSIONS.PRODUCT_UPDATE,
    PERMISSIONS.PRODUCT_DELETE,
    PERMISSIONS.INVOICE_CREATE,
    PERMISSIONS.INVOICE_READ,
    PERMISSIONS.INVOICE_UPDATE,
    PERMISSIONS.INVOICE_DELETE,
    PERMISSIONS.PAYMENT_CREATE,
    PERMISSIONS.PAYMENT_READ,
    PERMISSIONS.PAYMENT_UPDATE,
    PERMISSIONS.PAYMENT_DELETE,
    PERMISSIONS.REPORT_READ,
    PERMISSIONS.REPORT_EXPORT,
    PERMISSIONS.SETTINGS_READ,
    PERMISSIONS.SETTINGS_UPDATE,
  ]),
  
  BRANCH_MANAGER: new Set([
    PERMISSIONS.BRANCH_READ,
    PERMISSIONS.USER_READ,
    PERMISSIONS.USER_CREATE,
    PERMISSIONS.USER_UPDATE,
    PERMISSIONS.CUSTOMER_CREATE,
    PERMISSIONS.CUSTOMER_READ,
    PERMISSIONS.CUSTOMER_UPDATE,
    PERMISSIONS.CUSTOMER_DELETE,
    PERMISSIONS.PRODUCT_READ,
    PERMISSIONS.INVOICE_CREATE,
    PERMISSIONS.INVOICE_READ,
    PERMISSIONS.INVOICE_UPDATE,
    PERMISSIONS.PAYMENT_CREATE,
    PERMISSIONS.PAYMENT_READ,
    PERMISSIONS.PAYMENT_UPDATE,
    PERMISSIONS.REPORT_READ,
    PERMISSIONS.REPORT_EXPORT,
    PERMISSIONS.SETTINGS_READ,
  ]),
  
  AGENT: new Set([
    PERMISSIONS.CUSTOMER_CREATE,
    PERMISSIONS.CUSTOMER_READ,
    PERMISSIONS.CUSTOMER_UPDATE,
    PERMISSIONS.PRODUCT_READ,
    PERMISSIONS.INVOICE_CREATE,
    PERMISSIONS.INVOICE_READ,
    PERMISSIONS.PAYMENT_CREATE,
    PERMISSIONS.PAYMENT_READ,
    PERMISSIONS.REPORT_READ,
  ]),
  
  COLLECTOR: new Set([
    PERMISSIONS.CUSTOMER_READ,
    PERMISSIONS.PAYMENT_CREATE,
    PERMISSIONS.PAYMENT_READ,
    PERMISSIONS.INVOICE_READ,
    PERMISSIONS.REPORT_READ,
  ]),
};

export interface RbacContext {
  user: AuthUser;
  companyId?: string | null;
  branchId?: string | null;
}

/**
 * Get role level from hierarchy
 */
export function getRoleLevel(role: string): number {
  return ROLE_HIERARCHY[role] || 0;
}

/**
 * Check if role A is higher or equal to role B
 */
export function isRoleAtLeast(roleA: string, roleB: string): boolean {
  return getRoleLevel(roleA) >= getRoleLevel(roleB);
}

/**
 * Check if user has a specific permission
 */
export function hasPermission(user: AuthUser, permission: string): boolean {
  const permissions = ROLE_PERMISSIONS[user.role];
  return permissions?.has(permission) ?? false;
}

/**
 * Check if user has any of the specified permissions
 */
export function hasAnyPermission(user: AuthUser, permissions: string[]): boolean {
  return permissions.some((permission) => hasPermission(user, permission));
}

/**
 * Check if user has all of the specified permissions
 */
export function hasAllPermissions(user: AuthUser, permissions: string[]): boolean {
  return permissions.every((permission) => hasPermission(user, permission));
}

/**
 * Get all permissions for a role
 */
export function getRolePermissions(role: string): string[] {
  return Array.from(ROLE_PERMISSIONS[role] || []);
}

/**
 * Check if user can access a specific company
 */
export function canAccessCompany(user: AuthUser, companyId: string): boolean {
  // Super admin can access all companies
  if (user.role === 'SUPER_ADMIN') {
    return true;
  }
  
  // Other roles can only access their own company
  return user.companyId === companyId;
}

/**
 * Check if user can access a specific branch
 */
export function canAccessBranch(user: AuthUser, companyId: string, branchId?: string | null): boolean {
  // First check company access
  if (!canAccessCompany(user, companyId)) {
    return false;
  }
  
  // Super admin and company admin can access all branches in their company
  if (user.role === 'SUPER_ADMIN' || user.role === 'COMPANY_ADMIN') {
    return true;
  }
  
  // Branch manager can only access their own branch
  if (user.role === 'BRANCH_MANAGER') {
    return user.branchId === branchId;
  }
  
  // Agent and Collector can access their assigned branch
  return user.branchId === branchId;
}

/**
 * Check if user can manage another user
 */
export function canManageUser(manager: AuthUser, targetUserId: string): boolean {
  // Super admin can manage anyone
  if (manager.role === 'SUPER_ADMIN') {
    return true;
  }
  
  // Cannot manage yourself through this check
  if (manager.id === targetUserId) {
    return false;
  }
  
  // For other roles, we need to check the target user's role and company/branch
  return true; // Simplified - actual check would query the target user
}

/**
 * Check if user can modify another user based on role hierarchy
 */
export async function canModifyUser(manager: AuthUser, targetUserId: string): Promise<{ allowed: boolean; reason?: string }> {
  // Super admin can modify anyone
  if (manager.role === 'SUPER_ADMIN') {
    return { allowed: true };
  }
  
  // Get target user
  const targetUser = await db.user.findUnique({
    where: { id: targetUserId },
    select: { id: true, role: true, companyId: true, branchId: true },
  });
  
  if (!targetUser) {
    return { allowed: false, reason: 'Target user not found' };
  }
  
  // Cannot modify yourself
  if (manager.id === targetUserId) {
    return { allowed: false, reason: 'Cannot modify yourself' };
  }
  
  // Check company access
  if (!canAccessCompany(manager, targetUser.companyId || '')) {
    return { allowed: false, reason: 'Cannot access user from different company' };
  }
  
  // Check role hierarchy - can only modify users with lower or equal role
  if (getRoleLevel(manager.role) <= getRoleLevel(targetUser.role)) {
    return { allowed: false, reason: 'Cannot modify user with equal or higher role' };
  }
  
  // Branch managers can only modify users in their branch
  if (manager.role === 'BRANCH_MANAGER') {
    if (manager.branchId !== targetUser.branchId) {
      return { allowed: false, reason: 'Cannot modify user from different branch' };
    }
  }
  
  return { allowed: true };
}

/**
 * Get company filter for user's data access
 */
export function getCompanyFilter(user: AuthUser): Record<string, unknown> {
  if (user.role === 'SUPER_ADMIN') {
    return {};
  }
  
  if (!user.companyId) {
    return { companyId: 'none' }; // Will return no results
  }
  
  return { companyId: user.companyId };
}

/**
 * Get branch filter for user's data access
 */
export function getBranchFilter(user: AuthUser): Record<string, unknown> {
  if (user.role === 'SUPER_ADMIN') {
    return {};
  }
  
  if (!user.companyId) {
    return { companyId: 'none' };
  }
  
  if (user.role === 'COMPANY_ADMIN') {
    return { companyId: user.companyId };
  }
  
  // Branch Manager, Agent, Collector - can only see their branch
  return {
    companyId: user.companyId,
    branchId: user.branchId,
  };
}

/**
 * Require authentication and return user or throw
 */
export async function requireAuth(): Promise<AuthUser> {
  const user = await getCurrentUser();
  
  if (!user) {
    throw new Error('Unauthorized');
  }
  
  return user;
}

/**
 * Require specific permission
 */
export async function requirePermission(permission: string): Promise<AuthUser> {
  const user = await requireAuth();
  
  if (!hasPermission(user, permission)) {
    throw new Error('Forbidden');
  }
  
  return user;
}

/**
 * Require any of the specified permissions
 */
export async function requireAnyPermission(permissions: string[]): Promise<AuthUser> {
  const user = await requireAuth();
  
  if (!hasAnyPermission(user, permissions)) {
    throw new Error('Forbidden');
  }
  
  return user;
}

/**
 * Get current user context for RBAC
 */
export async function getRbacContext(): Promise<RbacContext | null> {
  const user = await getCurrentUser();
  const payload = await getAuthPayload();
  
  if (!user || !payload) {
    return null;
  }
  
  return {
    user,
    companyId: payload.companyId,
    branchId: payload.branchId,
  };
}
