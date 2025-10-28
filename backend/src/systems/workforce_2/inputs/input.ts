import { Socket } from "socket.io";
import { redis } from "../../..";
import { io } from "../../..";
import { State, Reading, Stats } from "../types";

export async function input(socket: Socket) {
	return socket.on("workforce_2/input", async (data, callback) => {
		try {
			const { userId, areaId, rcpm, count, in: rollsIn } = data;
			const timestamp = Date.now();
			const reading: Reading = { rcpm, count, in: rollsIn, timestamp };

			let cumulativeCount = count;
			let cumulativeIn = rollsIn;
			console.log({ reading });

			const readingListKey = `${userId}:workforce_2:${areaId}:readingList`;
			const stateKey = `${userId}:workforce_2`;

			const stateStr = await redis.hget(stateKey, areaId);
			let state = stateStr ? (JSON.parse(stateStr) as State) : null;

			let stats: Stats;
			if (state) {
				cumulativeCount = state.stats.cumulativeCount + count;
				cumulativeIn = state.stats.cumulativeIn + rollsIn;
				// Normal processing - continue with existing stats
				stats = {
					readingCount: state.stats.readingCount + 1,
					rcpmSum: state.stats.rcpmSum + rcpm,
					rcpmAvg:
						(state.stats.rcpmSum + rcpm) / (state.stats.readingCount + 1),
					startTime: state.stats.startTime,
					endTime: timestamp,
					cumulativeCount,
					cumulativeIn,
				};
			} else {
				// No existing state - start fresh
				stats = {
					readingCount: 1,
					rcpmSum: rcpm,
					rcpmAvg: rcpm,
					startTime: timestamp,
					endTime: timestamp,
					cumulativeCount,
					cumulativeIn,
				};
			}
			reading.count = cumulativeCount;
			reading.in = cumulativeIn;

			await redis
				.rpush(readingListKey, JSON.stringify(reading))
				.catch((error) => {
					console.error("Error updating redis cache", {
						userId,
						areaId,
						reading,
						error,
					});
				});

			// Check if cache was cleared between read and write (race condition prevention)
			const currentStateStr = await redis.hget(stateKey, areaId);
			if (!currentStateStr && state) {
				// Cache was cleared by createReports during processing - reset startTime
				stats.startTime = timestamp;
				console.log(
					`🔄 Cache cleared during processing for area ${areaId}, resetting startTime to ${timestamp}`
				);
			}
			const connectionState = {
				lastReadingTime: timestamp,
				latestReading: reading,
			};

			state = {
				stats,
				connectionState,
			};

			await redis
				.hset(stateKey, {
					[areaId]: JSON.stringify(state),
				})
				.catch((error) => {
					console.error("Error updating state", {
						userId,
						areaId,
						state,
						error,
					});
				});

			// Broadcast to all connected sockets
			io.to(userId).emit(`workforce_2/realtime_update/${areaId}`, state);
		} catch (error) {
			console.error("Error in workforce_2/input", {
				data,
				error,
			});
			callback(error);
		}
	});
}
