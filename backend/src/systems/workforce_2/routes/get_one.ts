import { Request, Response } from "express";
import { handler } from "../../../utils/handler";
import { AuthenticatedRequest } from "../../../utils/types";
import { AreaService } from "../services/AreaService";
import { log } from "console";
import { redis } from "../../..";
import type { State, Reading } from "../types";

export const get_one = handler(
	async (req: AuthenticatedRequest, res: Response) => {
		try {
			const { areaId } = req.query as { areaId: string };
			const { orgId, role } = req.user!.workforce_2!;

			const area = await AreaService.getArea(
				req.user!.userId,
				orgId,
				role,
				areaId
			);

			if (!area) {
				throw new Error("Area not found or unauthorized access");
			}

			// Fetch latest cache data from Redis (prefer org-scoped keys, fallback to user-scoped keys)
			const orgStateKey = `${orgId}:workforce_2`;
			const userStateKey = `${req.user!.userId}:workforce_2`;
			const orgReadingListKey = `${orgId}:workforce_2:${areaId}:readingList`;
			const userReadingListKey = `${
				req.user!.userId
			}:workforce_2:${areaId}:readingList`;

			const [
				cachedDataStrOrg,
				cachedDataStrUser,
				readingListOrg,
				readingListUser,
			] = await Promise.all([
				redis.hget(orgStateKey, areaId),
				redis.hget(userStateKey, areaId),
				redis.lrange(orgReadingListKey, 0, -1),
				redis.lrange(userReadingListKey, 0, -1),
			]);

			const cachedDataStr = cachedDataStrOrg || cachedDataStrUser;
			const readingListStrings =
				readingListOrg && readingListOrg.length > 0
					? readingListOrg
					: readingListUser;

			const realtimeData = cachedDataStr
				? (JSON.parse(cachedDataStr) as State)
				: null;
			const readingList = (readingListStrings || []).map((item) =>
				JSON.parse(item)
			) as Reading[];

			res.json({
				realtimeData,
				readingList,
				area,
			});
		} catch (error) {
			log("Error getting area:", error);
			res.status(500).json({ error: "Failed to get area" });
		}
	}
);
