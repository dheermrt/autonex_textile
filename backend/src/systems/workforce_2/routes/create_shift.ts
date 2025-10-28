import { Request, Response } from "express";
import { handler } from "../../../utils/handler";
import { AuthenticatedRequest } from "../../../utils/types";
import { SHIFT_2 } from "../models/SHIFT_2";
import { log } from "console";

export const create_shift = handler(
	async (req: AuthenticatedRequest, res: Response) => {
		try {
			const { name, start, end } = req.body;
			const { orgId } = req.user!.workforce_2!;

			const shift = await SHIFT_2.create({
				orgId,
				name,
				start,
				end,
			});

			res.json(shift);
		} catch (error) {
			log("Error creating shift:", error);
			res.status(500).json({ error: "Failed to create shift" });
		}
	}
);
