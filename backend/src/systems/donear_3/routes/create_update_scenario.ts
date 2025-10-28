import { Request, Response } from "express";
import { handler } from "../../../utils/handler";
import { AuthenticatedRequest } from "../../../utils/types";
import { log } from "console";
import { z } from "zod";
import { assertZ } from "../../../utils/assertZ";
import { SCENARIO_3 } from "../models/SCENARIO_3";
import { ForecastService } from "../services/ForecastService";

const scenarioSchema = z.object({
	scenarioId: z.string().optional(),
	name: z.string(),
	description: z.string().optional(),
	parameters: z.object({
		cottonPriceIndex: z.number().min(0).max(100),
		marketDemandIndex: z.number().min(0).max(100),
		customFactors: z.record(z.string(), z.number()).optional(),
	}),
	impact: z.object({
		adjustedRevenue: z.number(),
		revenueChange: z.number(),
		adjustedGrowth: z.number(),
	}),
	isActive: z.boolean().optional(),
});

export const create_update_scenario = handler(
	async (req: AuthenticatedRequest, res: Response) => {
		try {
			const { orgId, role } = req.user!.donear_3!;

			// Only admins can create/update scenarios
			if (!ForecastService.canModify(role)) {
				return res.status(403).json({ error: "Insufficient permissions" });
			}

			assertZ(scenarioSchema, req.body);

			const { scenarioId, name, description, parameters, impact, isActive } =
				req.body;

			let scenario;

			if (scenarioId) {
				// Update existing scenario
				scenario = await SCENARIO_3.findOneAndUpdate(
					{
						_id: scenarioId,
						orgId,
					},
					{
						name,
						description,
						parameters,
						impact,
						isActive,
					},
					{ new: true }
				);

				if (!scenario) {
					return res.status(404).json({ error: "Scenario not found" });
				}

				// If setting this scenario as active, deactivate others
				if (isActive) {
					await SCENARIO_3.updateMany(
						{
							orgId,
							_id: { $ne: scenarioId },
						},
						{ isActive: false }
					);
				}
			} else {
				// Create new scenario
				scenario = await SCENARIO_3.create({
					orgId,
					name,
					description,
					parameters,
					impact,
					isActive: isActive || false,
				});

				// If setting this scenario as active, deactivate others
				if (isActive) {
					await SCENARIO_3.updateMany(
						{
							orgId,
							_id: { $ne: scenario._id },
						},
						{ isActive: false }
					);
				}
			}

			res.json(scenario);
		} catch (error) {
			log("Error in donear_3/create_update_scenario:", error);
			res.status(500).json({ error: "Failed to create/update scenario" });
		}
	}
);
