import { Request, Response } from "express";
import { handler } from "../../../utils/handler";
import { AuthenticatedRequest } from "../../../utils/types";
import { SHIFT_REPORT_2 } from "../models/SHIFT_REPORT_2";
import { log } from "console";

export const get_shift_reports = handler(
	async (req: AuthenticatedRequest, res: Response) => {
		try {
			const { areaId, startDate, endDate } = req.query as Record<
				string,
				string
			>;
			const { orgId } = req.user!.workforce_2!;

			const query: Record<string, unknown> = { orgId };

			if (areaId) {
				query.area = areaId;
			}

			if (startDate && endDate) {
				query.startTime = {
					$gte: new Date(startDate),
					$lte: new Date(endDate),
				};
			}

			const reports = await SHIFT_REPORT_2.find(query)
				.populate("area worker supervisor shift")
				.sort({ startTime: -1 });

			res.json({ reports });
		} catch (error) {
			log("Error getting shift reports:", error);
			res.status(500).json({ error: "Failed to get shift reports" });
		}
	}
);
