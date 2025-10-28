import { redis } from "../../..";
import { State } from "../types";

export const getAreaStats = async (orgId: string, areaId: string): Promise<State | null> => {
	try {
		const stateKey = `${orgId}:workforce_2`;
		const stateStr = await redis.hget(stateKey, areaId);
		
		if (!stateStr) {
			return null;
		}
		
		return JSON.parse(stateStr) as State;
	} catch (error) {
		console.error("Error getting area stats:", error);
		return null;
	}
};

export const getAllAreaStats = async (orgId: string): Promise<{ [areaId: string]: State }> => {
	try {
		const stateKey = `${orgId}:workforce_2`;
		const cache = await redis.hgetall(stateKey);
		
		const result: { [areaId: string]: State } = {};
		for (const [areaId, stateStr] of Object.entries(cache)) {
			result[areaId] = JSON.parse(stateStr) as State;
		}
		
		return result;
	} catch (error) {
		console.error("Error getting all area stats:", error);
		return {};
	}
};
