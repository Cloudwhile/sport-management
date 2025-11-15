import { JwtPayload } from 'jsonwebtoken';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        username: string;
        role: 'admin' | 'teacher' | 'class';
      };
    }
  }
}

export interface DecodedToken extends JwtPayload {
  id: number;
  username: string;
  role: 'admin' | 'teacher' | 'class';
}
