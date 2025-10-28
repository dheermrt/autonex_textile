import { Request, Response } from "express";
import { handler } from "../../../utils/handler";
import { AuthenticatedRequest } from "../../../utils/types";
import { log } from "console";
import { redis } from "../../..";
import { RevolutionCounter, State } from "../types";
import { MachineService } from "../services/MachineService";

export const get_all = handler(
	async (req: AuthenticatedRequest, res: Response) => {
		const { orgId, role } = req.user!.revolution_counter_1!;

		let realtimeData: { [machineId: string]: State } = {};
		let machines: RevolutionCounter[] = [];

		// OPTIMIZED: Single operation - get all accessible machines
		machines = await MachineService.getAllMachines(
			req.user!.userId,
			orgId,
			role
		);

		// Extract machine IDs for cache retrieval
		const machineIds: string[] = machines
			.map((m) => m._id?.toString())
			.filter(Boolean) as string[];

		// Get realtime data for accessible machines
		if (role === "admin") {
			// Admin gets all cache data for the organization
			const cache = await redis.hgetall(`${orgId}:revolution_counter_1`);
			for (const [machineId, stateStr] of Object.entries(cache)) {
				const state = JSON.parse(stateStr) as State;
				realtimeData[machineId] = {
					connectionState: state.connectionState || null,
					stats: state.stats || null,
				};
			}
		} else {
			// Operators and supervisors get cache only for their accessible machines
			realtimeData = await getCache(orgId, machineIds);
		}

		res.json({
			machines,
			realtimeData,
		});
	}
);

async function getCache(orgId: string, machineIds: string[]) {
	const result: { [machineId: string]: State } = {};

	if (!machineIds || machineIds.length === 0) return result;

	try {
		const key = `${orgId}:revolution_counter_1`;

		// Prefer hmget to fetch only the requested machineIds from the org hash
		let values: Array<string | null> = [];
		values = await redis.hmget(key, ...machineIds);

		for (let i = 0; i < machineIds.length; i++) {
			const id = machineIds[i];
			const stateStr = values[i];
			if (stateStr) {
				const state = JSON.parse(stateStr) as State;
				result[id] = {
					connectionState: state.connectionState || null,
					stats: state.stats || null,
				};
			}
		}
	} catch (err) {
		log("getCache error", err);
	}

	return result;
}
