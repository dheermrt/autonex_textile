import { Request, Response } from "express";
import { handler } from "../../../utils/handler";
import { AuthenticatedRequest } from "../../../utils/types";
import { MachineService } from "../services/MachineService";
import { log } from "console";

export const get_machine = handler(
	async (req: AuthenticatedRequest, res: Response) => {
		try {
			const { machineId } = req.query as { machineId: string };
			const { orgId, role } = req.user!.revolution_counter_1!;

			// OPTIMIZED: Single operation - get machine if accessible, null otherwise
			const machine = await MachineService.getMachine(
				req.user!.userId,
				orgId,
				role,
				machineId
			);

			if (!machine) {
				throw new Error("Machine not found or unauthorized access");
			}

			res.json(machine);
		} catch (error) {
			log("Error fetching machine:", error);
			res.status(404).json({ error: "Failed to fetch machine" });
		}
	}
);
