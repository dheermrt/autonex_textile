import { ENV, loadEnv } from "./utils/loadEnv";
import { Db } from "./modules/Db";
import { init_MQTT } from "./init_MQTT";
import { init_IO } from "./init_IO";
import { init_CRON_JOB } from "./cronJob/init_CRON_JOB";
import { init_EXPRESS } from "./init_EXPRESS";
import { createServer } from "http";
import { log } from "console";

loadEnv();

export const redis = Db.connectRedis(
	ENV.REDIS_OPTIONS.URI,
	ENV.REDIS_OPTIONS.PASSWORD,
	ENV.REDIS_OPTIONS.PORT
);
export const redisPub = redis.duplicate();
export const redisSub = redis.duplicate();

Db.connectMongoDB(ENV.MONGO_URI);

if (ENV.SERVER_TYPES.includes("cron")) {
	init_CRON_JOB();
}
if (ENV.SERVER_TYPES.includes("mqtt")) {
	init_MQTT();
}

const originArray = ENV.CLIENT_ORIGIN_URLS;

export const app = ENV.SERVER_TYPES.includes("normal")
	? init_EXPRESS({ originArray })
	: undefined;
const httpServer = app ? createServer(app) : undefined;

export const io = (
	httpServer ? init_IO(httpServer, { originArray }) : undefined
)!;

if (httpServer)
	httpServer.listen(ENV.PORT, () => {
		log(`✓ Server running on port ${ENV.PORT}`);
		if (app) log(`✓ Express API: port ${ENV.PORT}/api`);
		if (io) log(`✓ Socket.IO: ${ENV.PORT}`);
	});

process.on("uncaughtException", (error) => {
	console.error("Uncaught exception", error);
});

process.on("unhandledRejection", (error) => {
	console.error("Unhandled rejection", error);
});
