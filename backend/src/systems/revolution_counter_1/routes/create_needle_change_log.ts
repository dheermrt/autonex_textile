import { Request, Response } from "express";
import { handler } from "../../../utils/handler";
import { AuthenticatedRequest } from "../../../utils/types";
import { NEEDLE_CHANGE_LOG_1 } from "../models/NEEDLE_CHANGE_LOG_1";
import { REVOLUTION_COUNTER_1 } from "../models/REVOLUTION_COUNTER_1";
import { MachineService } from "../services/MachineService";
import { log } from "console";

export const create_needle_change_log = handler(
	async (req: AuthenticatedRequest, res: Response) => {
		try {
			const { machine } = req.body;
			const { orgId, role } = req.user!.revolution_counter_1!;

			// Validate machine access using MachineService
			const machineData = await MachineService.getMachine(
				req.user!.userId,
				orgId,
				role,
				machine
			);

			if (!machineData) {
				throw new Error("Machine not found or unauthorized access");
			}

			const needleChangeLog = await NEEDLE_CHANGE_LOG_1.create({
				machine,
				orgId,
			});

			// Update the machine's lastNeedleChange field
			await REVOLUTION_COUNTER_1.findByIdAndUpdate(
				machine,
				{ lastNeedleChange: needleChangeLog._id },
				{ new: true }
			);

			res.json(needleChangeLog);
		} catch (error) {
			log("Error creating needle change log:", error);
			res.status(500).json({ error: "Failed to create needle change log" });
		}
	}
);
