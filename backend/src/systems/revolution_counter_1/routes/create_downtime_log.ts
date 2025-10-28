import { log } from "console";
import { handler } from "../../../utils/handler";
import { AuthenticatedRequest } from "../../../utils/types";
import { DOWNTIME_LOG_1 } from "../models/DOWNTIME_LOG_1";
import { Request, Response } from "express";
import { DowntimeLog } from "../types";
import { MachineService } from "../services/MachineService";

export const create_downtime_log = handler(
	async (req: AuthenticatedRequest, res: Response) => {
		try {
			const { machine, startTime, endTime, reason } = req.body as DowntimeLog;
			const { orgId, role } = req.user!.revolution_counter_1!;

			// Validate machine access using MachineService
			const machineData = await MachineService.getMachine(
				req.user!.userId,
				orgId,
				role,
				machine.toString()
			);

			if (!machineData) {
				throw new Error("Machine not found or unauthorized access");
			}

			const downtimeLog = await DOWNTIME_LOG_1.create({
				machine,
				orgId,
				startTime,
				endTime,
				reason,
			});
			res.json(downtimeLog);
			// Note: socket.broadcast.emit removed - real-time updates need separate WebSocket/SSE implementation
		} catch (error) {
			log("Error creating downtime log:", error);
			res.status(500).json({ error: "Failed to create downtime log" });
		}
	}
);
