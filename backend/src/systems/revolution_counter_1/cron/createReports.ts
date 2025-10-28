import { redis } from "../../..";
import { REVOLUTION_COUNTER_1 } from "../models/REVOLUTION_COUNTER_1";
import { SHIFT_REPORT_1 } from "../models/SHIFT_REPORT_1";
import { DOWNTIME_LOG_1 } from "../models/DOWNTIME_LOG_1";
import { NEEDLE_CHANGE_LOG_1 } from "../models/NEEDLE_CHANGE_LOG_1";
import { getISTTime, createISTDate } from "../../../utils/timeUtils";
import type {
	State,
	ShiftReport,
	DowntimeLog,
	NeedleChangeLog,
} from "../types";

export async function createReports() {
	try {
		console.log("🔄 Starting report creation process...");

		// Get all Redis keys for revolution counters
		const allKeys = await redis.keys("*:revolution_counter_1");

		// console.log("allKeys", allKeys);
		if (allKeys.length === 0) {
			console.log("No revolution counter cache found");
			return;
		}

		// Get current time in IST timezone
		const istTime = getISTTime();
		const currentHour = istTime.hour;
		const currentMinute = istTime.minute;
		const currentTime = istTime.dateObject;

		console.log(
			`🕐 Current IST time: ${currentHour
				.toString()
				.padStart(2, "0")}:${currentMinute.toString().padStart(2, "0")}`
		);

		const reportsToCreate: Partial<ShiftReport>[] = [];
		const machinesToReset: string[] = [];

		// Process each user's revolution counters
		for (const key of allKeys) {
			const orgId = key.split(":")[0];

			// console.log("orgId", orgId);

			// Get ALL machines for this user from Redis cache
			const machineCache = await redis.hgetall(key);
			// console.log("machineCache", machineCache);

			if (Object.keys(machineCache).length === 0) {
				continue;
			}

			// Get ALL machine IDs that have readings
			const machineIds = Object.keys(machineCache);
			// console.log("machineIds", machineIds);

			// Get ALL machines from DB in one query
			const machines = await REVOLUTION_COUNTER_1.find({
				_id: { $in: machineIds },
				orgId,
			}).populate([
				"yarn",
				"shifts.shift",
				"shifts.operator",
				"shifts.supervisor",
			]);

			// Process each machine
			for (const machine of machines) {
				try {
					const stateStr = machineCache[machine._id.toString()];
					if (!stateStr) continue;

					const state: State = JSON.parse(stateStr);

					// Check each shift for this machine
					for (const shiftConfig of machine.shifts) {
						const shift = shiftConfig.shift;
						const shiftEndHour = shift.end.hour;
						const shiftEndMinute = shift.end.minute;
						// console.log("shiftEndHour", shiftEndHour);
						// console.log("shiftEndMinute", shiftEndMinute);
						// console.log("currentHour", currentHour);
						// console.log("currentMinute", currentMinute);

						// Check if current hour matches shift end hour and minute is 0
						if (
							currentHour === shiftEndHour &&
							currentMinute === shiftEndMinute
						) {
							console.log(
								`✅ Creating report for machine ${machine._id}, shift: ${shift.name}`
							);

							// Calculate shift start and end times
							const actualStartDate = new Date(state.stats.startTime);
							const actualStartIST = getISTTime(actualStartDate);

							console.log("actualStartIST", actualStartIST);

							const shiftStartTime = createISTDate(
								actualStartIST.year,
								actualStartIST.month,
								actualStartIST.day,
								actualStartIST.hour,
								actualStartIST.minute,
								actualStartIST.second
							);

							const shiftEndTime = currentTime;

							// Calculate idle percentage
							const totalTime =
								shiftEndTime.getTime() - shiftStartTime.getTime();
							const idlePercentage =
								totalTime > 0 ? (state.stats.idleTime / totalTime) * 100 : 0;

							// Calculate rolls based on yarn configuration
							const rolls =
								machine.yarn.countsPerRoll > 0
									? Math.floor(
											state.stats.cumulativeCount / machine.yarn.countsPerRoll
									  )
									: Math.floor(state.stats.cumulativeCount / 1000); // fallback

							// Get relevant downtime logs and needle change logs for this shift
							const { downtimeLogs, needleChangeLogs } = await getShiftLogs(
								machine._id,
								shiftStartTime,
								shiftEndTime
							);

							// Create report data
							const reportData: Partial<ShiftReport> = {
								machine: machine._id,
								orgId: machine.orgId,
								rpmAvg: state.stats.rpmAvg,
								rollInfo: {
									yarn: machine.yarn,
									cumulativeCount: state.stats.cumulativeCount,
									rolls: rolls,
								},
								shift: shift,
								idleTime: idlePercentage,
								operator: shiftConfig.operator._id,
								supervisor: shiftConfig.supervisor._id,
								downtimeLogs: downtimeLogs.map((log) => log._id),
								needleChangeLogs: needleChangeLogs.map((log) => log._id),
								startTime: shiftStartTime,
								endTime: shiftEndTime,
							};

							reportsToCreate.push(reportData);
							machinesToReset.push(`${orgId}:${machine._id}`);

							console.log(
								`✅ Queued report for machine ${machine._id}, shift: ${shift.name}`
							);
						}
					}
				} catch (error) {
					console.error(`Error processing machine ${machine._id}:`, error);
				}
			}
		}

		// Batch insert all reports
		if (reportsToCreate.length > 0) {
			await SHIFT_REPORT_1.insertMany(reportsToCreate);
			console.log(`📊 Created ${reportsToCreate.length} shift reports`);
		} else {
			console.log("No reports to create at this time");
		}

		// Clear Redis entries for machines that had reports created
		if (machinesToReset.length > 0) {
			await clearMachineCache(machinesToReset);
			console.log(`🗑️ Cleared cache for ${machinesToReset.length} machines`);
		}

		console.log("✅ Report creation process completed");
	} catch (error) {
		console.error("❌ Error in createReports:", error);
	}
}

/**
 * Clear machine cache from Redis after shift end
 */
async function clearMachineCache(machinesToDelete: string[]): Promise<void> {
	if (machinesToDelete.length === 0) return;

	try {
		// Group by userId to batch operations
		const userGroups = new Map<string, string[]>();

		for (const machineKey of machinesToDelete) {
			const [userId, machineId] = machineKey.split(":");
			if (!userGroups.has(userId)) {
				userGroups.set(userId, []);
			}
			userGroups.get(userId)!.push(machineId);
		}

		// Clear each user's machines
		for (const [userId, machineIds] of userGroups) {
			// Delete from main hash
			await redis.hdel(`${userId}:revolution_counter_1`, ...machineIds);

			// Delete reading lists
			const readingListKeys = machineIds.map(
				(machineId) => `${userId}:revolution_counter_1:${machineId}:readingList`
			);
			if (readingListKeys.length > 0) {
				await redis.del(...readingListKeys);
			}
		}

		console.log(`🗑️ Cleared cache for ${machinesToDelete.length} machines`);
	} catch (error) {
		console.error(`Error clearing machine cache:`, error);
	}
}

/**
 * Get relevant downtime logs and needle change logs for a specific shift
 * Uses intelligent logic to determine which logs belong to the shift
 */
async function getShiftLogs(
	machineId: string,
	shiftStartTime: Date,
	shiftEndTime: Date
): Promise<{
	downtimeLogs: DowntimeLog[];
	needleChangeLogs: NeedleChangeLog[];
}> {
	try {
		// Get all downtime logs for this machine that overlap with the shift
		const downtimeLogs = await DOWNTIME_LOG_1.find({
			machine: machineId,
			$or: [
				// Downtime starts during shift
				{
					startTime: {
						$gte: shiftStartTime,
						$lte: shiftEndTime,
					},
				},
				// Downtime ends during shift
				{
					endTime: {
						$gte: shiftStartTime,
						$lte: shiftEndTime,
					},
				},
				// Downtime completely encompasses the shift
				{
					startTime: { $lte: shiftStartTime },
					endTime: { $gte: shiftEndTime },
				},
				// Downtime is completely within the shift
				{
					startTime: { $gte: shiftStartTime },
					endTime: { $lte: shiftEndTime },
				},
			],
		}).sort({ startTime: 1 });

		// Get all needle change logs for this machine that were created during the shift
		const needleChangeLogs = await NEEDLE_CHANGE_LOG_1.find({
			machine: machineId,
			createdAt: {
				$gte: shiftStartTime,
				$lte: shiftEndTime,
			},
		}).sort({ createdAt: 1 });

		console.log(
			`📋 Found ${downtimeLogs.length} downtime logs and ${
				needleChangeLogs.length
			} needle change logs for shift ${shiftStartTime.toISOString()} - ${shiftEndTime.toISOString()}`
		);

		return { downtimeLogs, needleChangeLogs };
	} catch (error) {
		console.error(`Error getting shift logs for machine ${machineId}:`, error);
		return { downtimeLogs: [], needleChangeLogs: [] };
	}
}