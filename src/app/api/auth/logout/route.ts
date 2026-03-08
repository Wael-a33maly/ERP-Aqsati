import { NextRequest } from 'next/server';
import { clearAuthCookie, getCurrentUser } from '@/lib/auth';
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/utils/response';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return unauthorizedResponse('Not authenticated');
    }
    
    // Create audit log
    await db.auditLog.create({
      data: {
        userId: user.id,
        companyId: user.companyId,
        branchId: user.branchId,
        action: 'LOGOUT',
        entityType: 'User',
        entityId: user.id,
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    });
    
    // Clear auth cookie
    await clearAuthCookie();
    
    return successResponse(null, 'Logout successful');
    
  } catch (error) {
    console.error('Logout error:', error);
    return errorResponse('An error occurred during logout', 500);
  }
}
