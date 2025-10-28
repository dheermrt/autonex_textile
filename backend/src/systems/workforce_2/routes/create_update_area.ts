import { Request, Response } from "express";
import { handler } from "../../../utils/handler";
import { AuthenticatedRequest } from "../../../utils/types";
import { AREA_2 } from "../models/AREA_2";
import { AreaService } from "../services/AreaService";
import { log } from "console";

export const create_update_area = handler(
	async (req: AuthenticatedRequest, res: Response) => {
		try {
			const { areaId, name, maxRcpm, setRcpm, shifts } = req.body;
			const { orgId, role } = req.user!.workforce_2!;

			let area;
			if (areaId) {
				// Validate area access for updates
				const existingArea = await AreaService.getArea(
					req.user!.userId,
					orgId,
					role,
					areaId
				);

				if (!existingArea) {
					throw new Error("Area not found or unauthorized access");
				}

				area = await AREA_2.findOneAndUpdate(
					{
						_id: areaId,
						orgId: orgId,
					},
					{
						name,
						maxRcpm,
						setRcpm,
						shifts,
					},
					{ new: true }
				);
			} else {
				// Create new area
				area = await AREA_2.create({
					orgId,
					name,
					maxRcpm,
					setRcpm,
					shifts,
				});
			}

			if (!area) {
				throw new Error("Failed to create or update area");
			}

			const populatedArea = await AREA_2.findById(area._id).populate([
				"shifts.shift shifts.worker shifts.supervisor",
			]);
			res.json(populatedArea);
		} catch (error) {
			log("Error creating/updating area:", error);
			res.status(500).json({ error: "Failed to create or update area" });
		}
	}
);
