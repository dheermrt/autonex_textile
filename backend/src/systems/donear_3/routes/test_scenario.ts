import { Request, Response } from "express";
import { handler } from "../../../utils/handler";
import { AuthenticatedRequest } from "../../../utils/types";
import { log } from "console";
import { z } from "zod";
import { assertZ } from "../../../utils/assertZ";
import { ForecastService } from "../services/ForecastService";
import { calculateScenarioImpact } from "../utils/calculateForecast";

const testScenarioSchema = z.object({
	cottonPriceIndex: z.number().min(0).max(100),
	marketDemandIndex: z.number().min(0).max(100),
});

export const test_scenario = handler(
	async (req: AuthenticatedRequest, res: Response) => {
		try {
			const { orgId } = req.user!.donear_3!;

			assertZ(testScenarioSchema, req.body);

			const { cottonPriceIndex, marketDemandIndex } = req.body;

			// Get latest forecast to use as base
			const latestForecast = await ForecastService.getLatestForecast(orgId);

			if (!latestForecast) {
				return res.status(404).json({ error: "No base forecast available" });
			}

			// Calculate scenario impact
			const impact = calculateScenarioImpact(
				latestForecast.totalAmount,
				cottonPriceIndex,
				marketDemandIndex
			);

			res.json({
				baseForecast: {
					amount: latestForecast.totalAmount,
					growthRate: latestForecast.growthRate,
				},
				parameters: {
					cottonPriceIndex,
					marketDemandIndex,
				},
				impact,
			});
		} catch (error) {
			log("Error in donear_3/test_scenario:", error);
			res.status(500).json({ error: "Failed to test scenario" });
		}
	}
);
