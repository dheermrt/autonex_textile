import { Request, Response } from "express";
import { handler } from "../../../utils/handler";
import { AuthenticatedRequest } from "../../../utils/types";
import { log } from "console";
import { ForecastService } from "../services/ForecastService";

export const get_forecast = handler(
	async (req: AuthenticatedRequest, res: Response) => {
		try {
			const { forecastId } = req.query;
			const { orgId, role } = req.user!.donear_3!;

			if (!forecastId) {
				return res.status(400).json({ error: "Forecast ID is required" });
			}

			const forecast = await ForecastService.getForecast(
				req.user!.userId,
				orgId,
				role,
				forecastId as string
			);

			if (!forecast) {
				return res
					.status(404)
					.json({ error: "Forecast not found or access denied" });
			}

			res.json(forecast);
		} catch (error) {
			log("Error in donear_3/get_forecast:", error);
			res.status(500).json({ error: "Failed to fetch forecast" });
		}
	}
);
