import { Request, Response } from "express";
import { handler } from "../../../utils/handler";
import { AuthenticatedRequest } from "../../../utils/types";
import { log } from "console";
import { ACCURACY_METRIC_3 } from "../models/ACCURACY_METRIC_3";

export const get_accuracy_history = handler(
	async (req: AuthenticatedRequest, res: Response) => {
		try {
			const { orgId } = req.user!.donear_3!;
			const limit = req.query.limit ? parseInt(req.query.limit as string) : 12;

			const accuracyHistory = await ACCURACY_METRIC_3.find({
				orgId,
			})
				.sort({ period: -1 })
				.limit(limit);

			// Calculate overall metrics
			const totalAccuracy =
				accuracyHistory.reduce(
					(sum, metric) => sum + metric.accuracyPercentage,
					0
				) / (accuracyHistory.length || 1);

			res.json({
				history: accuracyHistory,
				summary: {
					averageAccuracy: Math.round(totalAccuracy * 100) / 100,
					periods: accuracyHistory.length,
					latestAccuracy: accuracyHistory[0]?.accuracyPercentage || 0,
				},
			});
		} catch (error) {
			log("Error in donear_3/get_accuracy_history:", error);
			res.status(500).json({ error: "Failed to fetch accuracy history" });
		}
	}
);
