import { redis } from "../../..";
import { io } from "../../..";
import { ENV } from "../../../utils/loadEnv";
import { State, Reading, Stats } from "../types";

export async function input(
	userId: string,
	machineId: string,
	message: string
) {
	const connectionTimeoutSeconds =
		ENV.REVOLUTION_COUNTER_1.CONNECTION_TIMEOUT_SECONDS;

	const frequencyInSeconds = 5;
	// trailingWindowMinutes can be made configurable per system; keep as constant for now
	const trailingWindowMinutes =
		ENV.REVOLUTION_COUNTER_1.TRAILING_WINDOW_AVG_MINUTES;
	const trailingWindowSize =
		Math.floor((trailingWindowMinutes * 60) / frequencyInSeconds) + 1;
	// log({ topic, message });
	// const arr = topic.split("/"); // revolution_counter_1/{userId}/{machineId}
	// const userId = arr[1];
	// const machineId = arr[2];
	// log({ userId, machineId });
	let reading: Reading;
	try {
		reading = JSON.parse(message) as Reading;
	} catch (error) {
		console.error("Invalid MQTT payload for revolution_counter_1", {
			userId,
			machineId,
			message,
		});
		return;
	}
	reading.timestamp = Date.now();
	const { rpm, timestamp, count } = reading;
	// log({ userId, machineId, rpm, timestamp, count });
	console.log({ reading });

	const windowKey = `${userId}:revolution_counter_1:${machineId}:windowList`;
	const readingListKey = `${userId}:revolution_counter_1:${machineId}:readingList`;
	const stateKey = `${userId}:revolution_counter_1`;

	const stateStr = await redis.hget(stateKey, machineId);
	let state = stateStr ? (JSON.parse(stateStr) as State) : null;

	let stats: Stats;
	if (state) {
		// Normal processing - continue with existing stats
		const addIdleTime = rpm > 0 ? 0 : timestamp - state.stats.endTime;
		stats = {
			readingCount: state.stats.readingCount + 1,
			rpmSum: state.stats.rpmSum + rpm,
			rpmAvg: (state.stats.rpmSum + rpm) / (state.stats.readingCount + 1),
			startTime: state.stats.startTime,
			endTime: timestamp,
			idleTime: state.stats.idleTime + addIdleTime,
			cumulativeCount: count,
		};
	} else {
		// No existing state - start fresh
		stats = {
			readingCount: 1,
			rpmSum: rpm,
			rpmAvg: rpm,
			startTime: timestamp,
			endTime: timestamp,
			idleTime: 0,
			cumulativeCount: count,
		};
	}

	const connectionState = {
		connectionTimeoutSeconds,
		lastReadingTime: timestamp,
		latestReading: reading,
	};

	await Promise.all([
		redis.rpush(readingListKey, JSON.stringify(reading)),
		redis.ltrim(windowKey, -trailingWindowSize, -1),
		redis.rpush(windowKey, count),
	]).catch((error) => {
		console.error("Error updating redis cache", {
			userId,
			machineId,
			reading,
			error,
		});
	});

	// Compute delta only when the queue is full enough
	const currentLen = await redis.llen(windowKey);
	if (currentLen >= trailingWindowSize) {
		const oldestStr = await redis.lindex(windowKey, 0);
		if (oldestStr) {
			const oldest = JSON.parse(oldestStr) as number;
			const delta = count - oldest; // counts in last trailingWindowMinutes
			// Ensure delta is non-negative (safeguard against edge cases)
			if (delta >= 0) {
				// average counts per minute over the trailing window
				const trailingWindowAvgCountPerMinute = delta / trailingWindowMinutes;
				stats = { ...stats, trailingWindowAvgCountPerMinute };
				// console.log({ trailingWindowAvgCountPerMinute });
			}
		}
	}

	// Check if cache was cleared between read and write (race condition prevention)
	const currentStateStr = await redis.hget(stateKey, machineId);
	if (!currentStateStr && state) {
		// Cache was cleared by createReports during processing - reset startTime
		stats.startTime = timestamp;
		console.log(
			`🔄 Cache cleared during processing for machine ${machineId}, resetting startTime to ${timestamp}`
		);
	}

	state = {
		stats,
		connectionState,
	};

	await redis
		.hset(stateKey, {
			[machineId]: JSON.stringify(state),
		})
		.catch((error) => {
			console.error("Error updating state", {
				userId,
				machineId,
				state,
				error,
			});
		});

	io.to(userId).emit(
		`revolution_counter_1/realtime_update/${machineId}`,
		state
	);
}
