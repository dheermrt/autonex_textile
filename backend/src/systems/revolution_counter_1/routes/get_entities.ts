import { Request, Response } from "express";
import { handler } from "../../../utils/handler";
import { AuthenticatedRequest } from "../../../utils/types";
import { YARN_1 } from "../models/YARN_1";
import { SUPERVISOR_1 } from "../models/SUPERVISOR_1";
import { OPERATOR_1 } from "../models/OPERATOR_1";
import { SHIFT_1 } from "../models/SHIFT_1";
import { LOCATION_1 } from "../models/LOCATION_1";
import { log } from "console";

export const get_entities = handler(
	async (req: AuthenticatedRequest, res: Response) => {
		try {
			const { orgId } = req.user!.revolution_counter_1!;

			const [yarns, operators, supervisors, shifts, locations] =
				await Promise.all([
					YARN_1.find({
						orgId: orgId,
					}),
					OPERATOR_1.find({
						orgId: orgId,
					}).populate({
						path: "user",
						select: "name email createdAt",
						populate: {
							path: "revolution_counter_1.ticket",
							select: "name features",
						},
					}),
					SUPERVISOR_1.find({
						orgId: orgId,
					}).populate({
						path: "user",
						select: "name email createdAt",
						populate: {
							path: "revolution_counter_1.ticket",
							select: "name features",
						},
					}),
					SHIFT_1.find({
						orgId: orgId,
					}),
					LOCATION_1.find({
						orgId: orgId,
					}),
				]);

			res.json({
				yarns,
				operators,
				supervisors,
				shifts,
				locations,
			});
		} catch (error) {
			log("Error fetching entities:", error);
			res.status(500).json({ error: "Failed to fetch entities" });
		}
	}
);
