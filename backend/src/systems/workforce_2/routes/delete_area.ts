import { Request, Response } from "express";
import { handler } from "../../../utils/handler";
import { AuthenticatedRequest } from "../../../utils/types";
import { AREA_2 } from "../models/AREA_2";
import { log } from "console";

export const delete_area = handler(
	async (req: AuthenticatedRequest, res: Response) => {
		try {
			const { areaId } = req.body;
			const { orgId } = req.user!.workforce_2!;

			const deletedArea = await AREA_2.findOneAndDelete({
				_id: areaId,
				orgId: orgId,
			});

			if (!deletedArea) {
				throw new Error("Area not found or unauthorized access");
			}

			res.json({ success: true, deletedArea });
		} catch (error) {
			log("Error deleting area:", error);
			res.status(500).json({ error: "Failed to delete area" });
		}
	}
);
