import { Request, Response } from "express";
import { handler } from "../../../utils/handler";
import { AuthenticatedRequest } from "../../../utils/types";
import { LOCATION_1 } from "../models/LOCATION_1";
import { log } from "console";

export const create_location = handler(
	async (req: AuthenticatedRequest, res: Response) => {
		try {
			const { locationId, name } = req.body;
			const { orgId } = req.user!.revolution_counter_1!;

			let location;
			if (locationId) {
				// Update existing location
				location = await LOCATION_1.findOneAndUpdate(
					{
						_id: locationId,
						orgId: orgId,
					},
					{
						name,
					},
					{ new: true }
				);
			} else {
				// Create new location
				location = await LOCATION_1.create({
					orgId,
					name,
				});
			}

			if (!location) {
				throw new Error("Failed to create or update location");
			}

			res.json(location);
		} catch (error) {
			log("Error creating/updating location:", error);
			res.status(500).json({ error: "Failed to create or update location" });
		}
	}
);
