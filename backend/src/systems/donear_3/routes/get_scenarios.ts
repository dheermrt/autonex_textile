import { Request, Response } from "express";
import { handler } from "../../../utils/handler";
import { AuthenticatedRequest } from "../../../utils/types";
import { log } from "console";
import { SCENARIO_3 } from "../models/SCENARIO_3";

export const get_scenarios = handler(
	async (req: AuthenticatedRequest, res: Response) => {
		try {
			const { orgId } = req.user!.donear_3!;

			const scenarios = await SCENARIO_3.find({
				orgId,
			}).sort({ createdAt: -1 });

			res.json(scenarios);
		} catch (error) {
			log("Error in donear_3/get_scenarios:", error);
			res.status(500).json({ error: "Failed to fetch scenarios" });
		}
	}
);
