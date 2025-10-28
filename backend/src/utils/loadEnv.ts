import { config } from "dotenv";
import { exit } from "process";

export let ENV = {
	PORT: 0,
	JWT_SECRET: "",
	MONGO_URI: "",
	REDIS_OPTIONS: {
		URI: "",
		PASSWORD: "",
		PORT: 0,
	},
	CLIENT_ORIGIN_URLS: [] as string[],
	MQTT_BROKER_URL: "",
	MQTT_USERNAME: "",
	MQTT_PASSWORD: "",
	MQTT_CLIENT_ID: "",
	SERVER_TYPES: [] as string[],
	MODE: "",
	// MACHINEESSS
	REVOLUTION_COUNTER_1: {} as REVOLUTION_COUNTER_1,
};
export const loadEnv = () => {
	config({ quiet: true });
	const {
		PORT,
		JWT_SECRET,
		MONGO_URI,
		REDIS_URI,
		REDIS_PASSWORD,
		REDIS_PORT,
		CLIENT_ORIGIN_URLS,
		SERVER_TYPES,
		MODE,
		MQTT_BROKER_URL,
		MQTT_USERNAME,
		MQTT_PASSWORD,
		MQTT_CLIENT_ID,
		REVOLUTION_COUNTER_1,
	} = process.env;
	if (
		PORT &&
		JWT_SECRET &&
		MONGO_URI &&
		REDIS_URI &&
		// REDIS_PASSWORD &&
		REDIS_PORT &&
		CLIENT_ORIGIN_URLS &&
		SERVER_TYPES &&
		MODE &&
		MQTT_BROKER_URL &&
		MQTT_USERNAME &&
		MQTT_PASSWORD &&
		MQTT_CLIENT_ID &&
		// MACHINEESSS
		REVOLUTION_COUNTER_1
	) {
		ENV = {
			JWT_SECRET,
			MONGO_URI,
			REDIS_OPTIONS: {
				URI: REDIS_URI,
				PASSWORD: REDIS_PASSWORD || "",
				PORT: parseInt(REDIS_PORT),
			},
			PORT: parseInt(PORT),
			CLIENT_ORIGIN_URLS: CLIENT_ORIGIN_URLS.split(","),
			SERVER_TYPES: SERVER_TYPES.split(","),
			MODE,
			MQTT_BROKER_URL,
			MQTT_USERNAME,
			MQTT_PASSWORD,
			MQTT_CLIENT_ID,
			// MACHINEESSS
			REVOLUTION_COUNTER_1: JSON.parse(
				REVOLUTION_COUNTER_1
			) as REVOLUTION_COUNTER_1,
		};
		// log(ENV);
		// console.log(ENV);
	} else {
		console.error("Missing environment variables");
		exit(1);
	}
};

type REVOLUTION_COUNTER_1 = {
	CONNECTION_TIMEOUT_SECONDS: number;
	TRAILING_WINDOW_AVG_MINUTES: number;
};
