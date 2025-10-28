import { Request, Response } from "express";
import { handler } from "../../../utils/handler";
import { AuthenticatedRequest } from "../../../utils/types";
import { log } from "console";
import { redis } from "../../..";
import { Area, State } from "../types";
import { AreaService } from "../services/AreaService";

export const get_all = handler(
	async (req: AuthenticatedRequest, res: Response) => {
		const { orgId, role } = req.user!.workforce_2!;

		let realtimeData: { [areaId: string]: State } = {};
		let areas: Area[] = [];

		// OPTIMIZED: Single operation - get all accessible areas
		areas = await AreaService.getAllAreas(req.user!.userId, orgId, role);

		// Extract area IDs for cache retrieval
		const areaIds: string[] = areas
			.map((a) => a._id?.toString())
			.filter(Boolean) as string[];

		// Get realtime data for accessible areas
		if (role === "admin") {
			// Admin gets all cache data for the organization
			const cache = await redis.hgetall(`${orgId}:workforce_2`);
			for (const [areaId, stateStr] of Object.entries(cache)) {
				const state = JSON.parse(stateStr) as State;
				realtimeData[areaId] = {
					stats: state.stats || null,
					connectionState: state.connectionState || null,
				};
			}
		} else {
			// Workers and supervisors get cache only for their accessible areas
			realtimeData = await getCache(orgId, areaIds);
		}

		res.json({
			areas,
			realtimeData,
		});
	}
);

async function getCache(orgId: string, areaIds: string[]) {
	const result: { [areaId: string]: State } = {};

	if (!areaIds || areaIds.length === 0) return result;

	try {
		const key = `${orgId}:workforce_2`;

		// Prefer hmget to fetch only the requested areaIds from the org hash
		let values: Array<string | null> = [];
		values = await redis.hmget(key, ...areaIds);

		for (let i = 0; i < areaIds.length; i++) {
			const id = areaIds[i];
			const stateStr = values[i];
			if (stateStr) {
				const state = JSON.parse(stateStr) as State;
				result[id] = {
					stats: state.stats || null,
					connectionState: state.connectionState || null,
				};
			}
		}
	} catch (err) {
		log("getCache error", err);
	}

	return result;
}
