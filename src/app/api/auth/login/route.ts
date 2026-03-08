import { NextRequest } from 'next/server';
import { authenticateUser } from '@/lib/auth';
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/utils/response';
import { validateBody, loginSchema } from '@/lib/utils/validation';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  console.log('[Login API] Received login request');
  try {
    // Validate request body
    const validation = await validateBody(loginSchema, request);
    
    if (!validation.success) {
      console.log('[Login API] Validation failed:', validation.errors);
      return errorResponse(validation.errors.join(', '), 400);
    }
    
    const { email, password } = validation.data;
    console.log('[Login API] Attempting to authenticate:', email);
    
    // Authenticate user
    const result = await authenticateUser(email, password);
    
    if (!result) {
      console.log('[Login API] Authentication failed for:', email);
      return unauthorizedResponse('Invalid email or password');
    }
    
    console.log('[Login API] Authentication successful for:', email);
    
    // Create audit log
    try {
      await db.auditLog.create({
        data: {
          userId: result.user.id,
          companyId: result.user.companyId,
          branchId: result.user.branchId,
          action: 'LOGIN',
          entityType: 'User',
          entityId: result.user.id,
          ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
          userAgent: request.headers.get('user-agent') || 'unknown',
        },
      });
    } catch (auditError) {
      console.error('[Login API] Audit log error:', auditError);
      // Continue without audit log
    }
    
    return successResponse({
      user: result.user,
      token: result.token,
    }, 'Login successful');
    
  } catch (error) {
    console.error('[Login API] Error:', error);
    return errorResponse('An error occurred during login', 500);
  }
}
