import { Request, Response } from "express";
import { handler } from "../../../utils/handler";
import { AuthenticatedRequest } from "../../../utils/types";
import { AreaService } from "../services/AreaService";
import { log } from "console";

export const get_area = handler(
	async (req: AuthenticatedRequest, res: Response) => {
		try {
			const { areaId } = req.query as { areaId: string };
			const { orgId, role } = req.user!.workforce_2!;

			const area = await AreaService.getArea(
				req.user!.userId,
				orgId,
				role,
				areaId
			);

			if (!area) {
				throw new Error("Area not found or unauthorized access");
			}

			res.json(area);
		} catch (error) {
			log("Error getting area:", error);
			res.status(404).json({ error: "Failed to get area" });
		}
	}
);
