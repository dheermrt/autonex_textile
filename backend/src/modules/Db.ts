import { exit } from "process";
import mongoose from "mongoose";
import { Redis } from "ioredis";
import { log } from "console";
import { USER } from "../User/USER";
import { TICKET } from "../Ticket/TICKET";
// Remove static import of SETTINGS here
import { registerModels as registerModels_revolution_counter_1 } from "../systems/revolution_counter_1/registerModels";
import { registerModels as registerModels_workforce_2 } from "../systems/workforce_2/registerModels";
import { registerModels as registerModels_donear_3 } from "../systems/donear_3/registerModels";

export const Db = {
	connectMongoDB: async (MONGO_URI: string) => {
		try {
			await mongoose.connect(MONGO_URI);
			log("Connected to MongoDB");

			if (!mongoose.models.USER) mongoose.model("USER", USER.schema);
			if (!mongoose.models.TICKET) mongoose.model("TICKET", TICKET.schema);

			registerModels_revolution_counter_1();
			registerModels_workforce_2();
			registerModels_donear_3();
		} catch (error) {
			log("Error connecting to MongoDB", error);
			exit(1);
		}
	},
	connectRedis: (
		REDIS_URI: string,
		REDIS_PASSWORD: string,
		REDIS_PORT: number
	) => {
		try {
			const redis = new Redis({
				host: REDIS_URI,
				password: REDIS_PASSWORD,
				port: REDIS_PORT,
			});
			log("Connected to Redis");
			return redis;
		} catch (error) {
			log("Error connecting to Redis", error);
			exit(1);
		}
	},
};
