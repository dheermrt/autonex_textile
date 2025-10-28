import { Request, Response } from "express";
import { handler } from "../../../utils/handler";
import { AuthenticatedRequest } from "../../../utils/types";
import { redis } from "../../..";
import { log } from "console";
import { REVOLUTION_COUNTER_1 } from "../models/REVOLUTION_COUNTER_1";
import { getCurrentShift } from "../utils/getCurrentShift";
import { getShiftDowntimes } from "../utils/getShiftDowntimes";
import { MachineService } from "../services/MachineService";
import type { Reading, State, RevolutionCounter } from "../types";

export const get_one = handler(
	async (req: AuthenticatedRequest, res: Response) => {
		const { counterId } = req.query as { counterId: string };
		const { orgId, role } = req.user!.revolution_counter_1!;

		// Validate ObjectId format
		if (
			!counterId ||
			counterId.length !== 24 ||
			!/^[0-9a-fA-F]{24}$/.test(counterId)
		) {
			throw new Error("Invalid machine ID format");
		}

		// Always fetch fresh machine data from database
		const counter = (await REVOLUTION_COUNTER_1.findById(counterId).populate(
			"yarn shifts.shift shifts.operator shifts.supervisor lastNeedleChange"
		)) as RevolutionCounter | null;

		if (!counter) {
			throw new Error("Machine not found");
		}

		// Check if machine belongs to the organization
		if (counter.orgId.toString() !== orgId.toString()) {
			log(
				"get_one - Machine orgId mismatch:",
				counter.orgId.toString(),
				"vs",
				orgId.toString()
			);
			throw new Error("Unauthorized");
		}

		// Validate machine access using MachineService
		const machine = await MachineService.getMachine(
			req.user!.userId,
			orgId,
			role,
			counterId
		);

		if (!machine) {
			throw new Error("Machine not found or unauthorized access");
		}

		// Fetch latest cache data from Redis using orgId
		const [cachedDataStr, readingListStrings] = await Promise.all([
			redis.hget(`${orgId}:revolution_counter_1`, counterId),
			redis.lrange(
				`${orgId}:revolution_counter_1:${counterId}:readingList`,
				0,
				-1
			),
		]);

		const cachedData = cachedDataStr
			? (JSON.parse(cachedDataStr) as State)
			: null;
		const readingList = readingListStrings.map((item) =>
			JSON.parse(item)
		) as Reading[];

		const currentShift = getCurrentShift(counter.shifts.map((s) => s.shift));
		const shiftDowntimes = currentShift
			? await getShiftDowntimes(currentShift, counter)
			: [];

		res.json({
			realtimeData: cachedData,
			readingList,
			counter,
			shiftDowntimes,
		});
	}
);
