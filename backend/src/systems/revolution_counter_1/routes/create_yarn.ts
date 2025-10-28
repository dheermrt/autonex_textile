import { Request, Response } from "express";
import { handler } from "../../../utils/handler";
import { AuthenticatedRequest } from "../../../utils/types";
import { YARN_1 } from "../models/YARN_1";
import { log } from "console";

export const create_yarn = handler(
	async (req: AuthenticatedRequest, res: Response) => {
		try {
			const { quality, countsPerRoll } = req.body;
			const { orgId } = req.user!.revolution_counter_1!;

			const yarn = await YARN_1.create({
				orgId,
				quality,
				countsPerRoll,
			});
			res.json(yarn);
		} catch (error) {
			log("Error creating yarn:", error);
			res.status(500).json({ error: "Failed to create yarn" });
		}
	}
);
