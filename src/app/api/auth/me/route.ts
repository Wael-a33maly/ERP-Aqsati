import { getCurrentUser } from '@/lib/auth';
import { successResponse, unauthorizedResponse } from '@/lib/utils/response';

export async function GET() {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return unauthorizedResponse('Not authenticated');
    }
    
    return successResponse({ user });
    
  } catch (error) {
    console.error('Get current user error:', error);
    return unauthorizedResponse('Not authenticated');
  }
}
