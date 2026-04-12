import type { Request, Response } from "express";
import type { User } from "../../drizzle/schema";

export interface TrpcContext {
  user: User | null;
  req: Request;
  res: Response;
}
