// types/express/index.d.ts
declare namespace Express {
  export interface Request {
    user?: any; // Or better, the actual type you expect here
  }
}
