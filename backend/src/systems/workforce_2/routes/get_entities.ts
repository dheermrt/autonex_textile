import { Request, Response } from "express";
import { handler } from "../../../utils/handler";
import { AuthenticatedRequest } from "../../../utils/types";
import { WORKER_2 } from "../models/WORKER_2";
import { SUPERVISOR_2 } from "../models/SUPERVISOR_2";
import { SHIFT_2 } from "../models/SHIFT_2";
import { log } from "console";

export const get_entities = handler(
	async (req: AuthenticatedRequest, res: Response) => {
		try {
			const { orgId } = req.user!.workforce_2!;

			const [workers, supervisors, shifts] = await Promise.all([
				WORKER_2.find({ orgId }).populate({
					path: "user",
					select: "name email createdAt",
					populate: {
						path: "workforce_2.ticket",
						select: "name features",
					},
				}),
				SUPERVISOR_2.find({ orgId }).populate({
					path: "user",
					select: "name email createdAt",
					populate: {
						path: "workforce_2.ticket",
						select: "name features",
					},
				}),
				SHIFT_2.find({ orgId }),
			]);

			res.json({
				workers,
				supervisors,
				shifts,
			});
		} catch (error) {
			log("Error getting entities:", error);
			res.status(500).json({ error: "Failed to get entities" });
		}
	}
);
