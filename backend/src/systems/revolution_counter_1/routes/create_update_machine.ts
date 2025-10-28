import { Request, Response } from "express";
import { handler } from "../../../utils/handler";
import { AuthenticatedRequest } from "../../../utils/types";
import { REVOLUTION_COUNTER_1 } from "../models/REVOLUTION_COUNTER_1";
import { MachineService } from "../services/MachineService";
import { log } from "console";

export const create_update_machine = handler(
	async (req: AuthenticatedRequest, res: Response) => {
		try {
			const { machineId, name, location, maxRpm, setRpm, yarn, shifts } =
				req.body;
			const { orgId, role } = req.user!.revolution_counter_1!;

			let machine;
			if (machineId) {
				// Validate machine access for updates
				// Validate machine access using MachineService
				const existingMachine = await MachineService.getMachine(
					req.user!.userId,
					orgId,
					role,
					machineId
				);

				if (!existingMachine) {
					throw new Error("Machine not found or unauthorized access");
				}

				machine = await REVOLUTION_COUNTER_1.findOneAndUpdate(
					{
						_id: machineId,
						orgId: orgId,
					},
					{
						name,
						location,
						maxRpm,
						setRpm,
						yarn,
						shifts,
					},
					{ new: true }
				);
			} else {
				// Create new machine
				machine = await REVOLUTION_COUNTER_1.create({
					orgId,
					name,
					location,
					maxRpm,
					setRpm,
					yarn,
					shifts,
				});
			}

			if (!machine) {
				throw new Error("Failed to create or update machine");
			}

			// ✅ No synchronization needed - relationships are query-based now

			const counter = await REVOLUTION_COUNTER_1.findById(machine._id).populate(
				[
					"yarn location shifts.shift shifts.operator shifts.supervisor lastNeedleChange",
				]
			);
			res.json(counter);
		} catch (error) {
			log("Error creating/updating machine:", error);
			res.status(400).json({ error: "Failed to create or update machine" });
		}
	}
);
