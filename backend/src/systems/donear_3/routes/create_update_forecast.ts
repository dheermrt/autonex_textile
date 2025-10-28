import { Request, Response } from "express";
import { handler } from "../../../utils/handler";
import { AuthenticatedRequest } from "../../../utils/types";
import { log } from "console";
import { z } from "zod";
import { assertZ } from "../../../utils/assertZ";
import { FORECAST_3 } from "../models/FORECAST_3";
import { ForecastService } from "../services/ForecastService";

const forecastSchema = z.object({
	forecastId: z.string().optional(),
	period: z.string().or(z.date()),
	totalAmount: z.number().positive(),
	growthRate: z.number(),
	confidence: z.number().min(0).max(100),
	industryAvgGrowth: z.number(),
	benchmarkConfidence: z.number().min(0).max(100),
	previousYearAmount: z.number().positive(),
	status: z.enum(["draft", "published", "archived"]).optional(),
	notes: z.string().optional(),
});

export const create_update_forecast = handler(
	async (req: AuthenticatedRequest, res: Response) => {
		try {
			const { orgId, role } = req.user!.donear_3!;

			// Only admins can create/update forecasts
			if (!ForecastService.canModify(role)) {
				return res.status(403).json({ error: "Insufficient permissions" });
			}

			assertZ(forecastSchema, req.body);

			const {
				forecastId,
				period,
				totalAmount,
				growthRate,
				confidence,
				industryAvgGrowth,
				benchmarkConfidence,
				previousYearAmount,
				status,
				notes,
			} = req.body;

			let forecast;

			if (forecastId) {
				// Update existing forecast
				forecast = await FORECAST_3.findOneAndUpdate(
					{
						_id: forecastId,
						orgId,
					},
					{
						period: new Date(period),
						totalAmount,
						growthRate,
						confidence,
						industryAvgGrowth,
						benchmarkConfidence,
						previousYearAmount,
						status,
						notes,
					},
					{ new: true }
				);

				if (!forecast) {
					return res.status(404).json({ error: "Forecast not found" });
				}
			} else {
				// Create new forecast
				forecast = await FORECAST_3.create({
					orgId,
					period: new Date(period),
					totalAmount,
					growthRate,
					confidence,
					industryAvgGrowth,
					benchmarkConfidence,
					previousYearAmount,
					status: status || "draft",
					notes,
				});
			}

			res.json(forecast);
		} catch (error) {
			log("Error in donear_3/create_update_forecast:", error);
			res.status(500).json({ error: "Failed to create/update forecast" });
		}
	}
);
