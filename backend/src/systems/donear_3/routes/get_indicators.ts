import { Request, Response } from "express";
import { handler } from "../../../utils/handler";
import { AuthenticatedRequest } from "../../../utils/types";
import { log } from "console";
import { INDICATOR_3 } from "../models/INDICATOR_3";

export const get_indicators = handler(
	async (req: AuthenticatedRequest, res: Response) => {
		try {
			const { forecastId } = req.query;
			const { orgId } = req.user!.donear_3!;

			if (!forecastId) {
				return res.status(400).json({ error: "Forecast ID is required" });
			}

			const indicators = await INDICATOR_3.find({
				orgId,
				forecast: forecastId,
			})
				.populate("forecast")
				.sort({ contribution: -1 });

			res.json({ indicators });
		} catch (error) {
			log("Error in donear_3/get_indicators:", error);
			res.status(500).json({ error: "Failed to fetch indicators" });
		}
	}
);
