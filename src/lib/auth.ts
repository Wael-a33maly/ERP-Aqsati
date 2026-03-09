import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { verifyPassword } from '@/lib/utils/password';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-change-in-production';
const JWT_EXPIRES_IN = '7d';
const COOKIE_NAME = 'erp_auth_token';

export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
  companyId: string | null;
  branchId: string | null;
  iat?: number;
  exp?: number;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  nameAr: string | null;
  role: string;
  companyId: string | null;
  branchId: string | null;
  active: boolean;
  avatar: string | null;
  company?: {
    id: string;
    name: string;
    code: string;
  } | null;
  branch?: {
    id: string;
    name: string;
    code: string;
  } | null;
}

/**
 * Generate a JWT token
 */
export function generateToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

/**
 * Verify and decode a JWT token
 */
export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch {
    return null;
  }
}

/**
 * Set auth cookie
 */
export async function setAuthCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  });
}

/**
 * Get auth cookie
 */
export async function getAuthCookie(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE_NAME)?.value;
}

/**
 * Clear auth cookie
 */
export async function clearAuthCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

/**
 * Get current authenticated user from request
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const token = await getAuthCookie();
  
  if (!token) {
    return null;
  }
  
  const payload = verifyToken(token);
  
  if (!payload) {
    return null;
  }
  
  const user = await db.user.findUnique({
    where: { id: payload.userId },
    include: {
      company: {
        select: { id: true, name: true, code: true },
      },
      branch: {
        select: { id: true, name: true, code: true },
      },
    },
  });
  
  if (!user || !user.active) {
    return null;
  }
  
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    nameAr: user.nameAr,
    role: user.role,
    companyId: user.companyId,
    branchId: user.branchId,
    active: user.active,
    avatar: user.avatar,
    company: user.company,
    branch: user.branch,
  };
}

/**
 * Get current user's JWT payload
 */
export async function getAuthPayload(): Promise<JwtPayload | null> {
  const token = await getAuthCookie();
  
  if (!token) {
    return null;
  }
  
  return verifyToken(token);
}

/**
 * Authenticate user with email and password
 */
export async function authenticateUser(email: string, password: string): Promise<{ user: AuthUser; token: string } | null> {
  const user = await db.user.findUnique({
    where: { email: email.toLowerCase() },
    include: {
      company: {
        select: { id: true, name: true, code: true },
      },
      branch: {
        select: { id: true, name: true, code: true },
      },
    },
  });
  
  if (!user || !user.active) {
    return null;
  }
  
  const isValidPassword = await verifyPassword(password, user.password);
  
  if (!isValidPassword) {
    return null;
  }
  
  const token = generateToken({
    userId: user.id,
    email: user.email,
    role: user.role,
    companyId: user.companyId,
    branchId: user.branchId,
  });
  
  await setAuthCookie(token);
  
  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      nameAr: user.nameAr,
      role: user.role,
      companyId: user.companyId,
      branchId: user.branchId,
      active: user.active,
      avatar: user.avatar,
      company: user.company,
      branch: user.branch,
    },
    token,
  };
}

/**
 * Check if user is authenticated (middleware helper)
 */
export async function requireAuth(): Promise<AuthUser> {
  const user = await getCurrentUser();
  
  if (!user) {
    throw new Error('Unauthorized');
  }
  
  return user;
}

/**
 * Check if user has specific role
 */
export function hasRole(user: AuthUser, roles: string[]): boolean {
  return roles.includes(user.role);
}

/**
 * Check if user is Super Admin
 */
export function isSuperAdmin(user: AuthUser): boolean {
  return user.role === 'SUPER_ADMIN';
}

/**
 * Check if user is Company Admin
 */
export function isCompanyAdmin(user: AuthUser): boolean {
  return user.role === 'COMPANY_ADMIN';
}

/**
 * Check if user is Branch Manager
 */
export function isBranchManager(user: AuthUser): boolean {
  return user.role === 'BRANCH_MANAGER';
}

/**
 * Check if user is Agent
 */
export function isAgent(user: AuthUser): boolean {
  return user.role === 'AGENT';
}

/**
 * Check if user is Collector
 */
export function isCollector(user: AuthUser): boolean {
  return user.role === 'COLLECTOR';
}
