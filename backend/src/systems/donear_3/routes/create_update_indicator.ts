import { Request, Response } from "express";
import { handler } from "../../../utils/handler";
import { AuthenticatedRequest } from "../../../utils/types";
import { log } from "console";
import { z } from "zod";
import { assertZ } from "../../../utils/assertZ";
import { INDICATOR_3 } from "../models/INDICATOR_3";
import { ForecastService } from "../services/ForecastService";

const indicatorSchema = z.object({
	indicatorId: z.string().optional(),
	forecastId: z.string(),
	name: z.string(),
	category: z.string(),
	value: z.number(),
	contribution: z.number(),
	weight: z.number().min(0).max(1),
	trend: z.enum(["up", "down", "stable"]),
	color: z.string().optional(),
});

export const create_update_indicator = handler(
	async (req: AuthenticatedRequest, res: Response) => {
		try {
			const { orgId, role } = req.user!.donear_3!;

			// Only admins can create/update indicators
			if (!ForecastService.canModify(role)) {
				return res.status(403).json({ error: "Insufficient permissions" });
			}

			assertZ(indicatorSchema, req.body);

			const {
				indicatorId,
				forecastId,
				name,
				category,
				value,
				contribution,
				weight,
				trend,
				color,
			} = req.body;

			let indicator;

			if (indicatorId) {
				// Update existing indicator
				indicator = await INDICATOR_3.findOneAndUpdate(
					{
						_id: indicatorId,
						orgId,
					},
					{
						forecast: forecastId,
						name,
						category,
						value,
						contribution,
						weight,
						trend,
						color,
					},
					{ new: true }
				);

				if (!indicator) {
					return res.status(404).json({ error: "Indicator not found" });
				}
			} else {
				// Create new indicator
				indicator = await INDICATOR_3.create({
					orgId,
					forecast: forecastId,
					name,
					category,
					value,
					contribution,
					weight,
					trend,
					color,
				});
			}

			res.json(indicator);
		} catch (error) {
			log("Error in donear_3/create_update_indicator:", error);
			res.status(500).json({ error: "Failed to create/update indicator" });
		}
	}
);
