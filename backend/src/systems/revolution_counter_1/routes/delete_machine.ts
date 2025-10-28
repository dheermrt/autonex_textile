import { Request, Response } from "express";
import { handler } from "../../../utils/handler";
import { AuthenticatedRequest } from "../../../utils/types";
import { REVOLUTION_COUNTER_1 } from "../models/REVOLUTION_COUNTER_1";
import { log } from "console";
import { redis } from "../../../index";
import { MachineService } from "../services/MachineService";

export const delete_machine = handler(
	async (req: AuthenticatedRequest, res: Response) => {
		const { machineId } = req.body as { machineId: string };
		const { orgId, role } = req.user!.revolution_counter_1!;

		try {
			// Validate machine access
			// Validate machine access using MachineService
			const machineData = await MachineService.getMachine(
				req.user!.userId,
				orgId,
				role,
				machineId
			);

			if (!machineData) {
				throw new Error("Machine not found or unauthorized access");
			}

			// Verify machine exists and belongs to organization
			const machine = await REVOLUTION_COUNTER_1.findOne({
				_id: machineId,
				orgId: orgId,
			});

			if (!machine) {
				res.status(404).json({ error: "Machine not found or access denied" });
				return;
			}

			// Delete machine from database
			await REVOLUTION_COUNTER_1.findByIdAndDelete(machineId);

			// Clean up Redis cache for this machine using orgId pattern
			const keysToDelete = [
				`${orgId}:revolution_counter_1:${machineId}:readingList`,
				`${orgId}:revolution_counter_1:${machineId}:windowList`,
			];

			// Also remove from the main hash
			await redis.hdel(`${orgId}:revolution_counter_1`, machineId);

			for (const key of keysToDelete) {
				await redis.del(key);
			}

			log(`Machine ${machineId} deleted successfully`);
			res.json({ success: true, deletedMachineId: machineId });
		} catch (error) {
			log("Error deleting machine:", error);
			res.status(500).json({ error: "Failed to delete machine" });
		}
	}
);
