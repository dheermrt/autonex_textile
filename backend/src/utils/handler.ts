import { log } from "console";
import { Request, Response } from "express";

export function handler(fn: (req: Request, res: Response) => Promise<unknown>) {
	return async (req: Request, res: Response) => {
		try {
			await fn(req, res);
		} catch (error) {
			log({ error });
			res.status(500).json({
				error: (error as Error).message || "Internal server error",
			});
		}
	};
}
