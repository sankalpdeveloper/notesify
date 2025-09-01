import { NextRequest } from "next/server";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export interface AuthUser {
  userId: number;
  email: string;
}

export async function getAuthUser(request: NextRequest): Promise<AuthUser | null> {
  try {
    const token = request.cookies.get("auth-token")?.value;

    if (!token || !JWT_SECRET) {
      return null;
    }

    const decoded = jwt.verify(token, JWT_SECRET) as unknown;
    
    // Type guard to ensure the decoded token has the required properties
    if (typeof decoded === 'object' && decoded !== null && 
        'userId' in decoded && 'email' in decoded) {
      return decoded as AuthUser;
    }
    
    return null;
  } catch (error) {
    console.error("Invalid authentication token", error);
    return null;
  }
}

export function createAuthResponse(error: string, status: number) {
  return Response.json({ error }, { status });
}
