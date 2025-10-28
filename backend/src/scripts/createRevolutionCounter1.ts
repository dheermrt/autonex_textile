import mongoose from "mongoose";
import { Db } from "../modules/Db";
import { REVOLUTION_COUNTER_1 } from "../systems/revolution_counter_1/models/REVOLUTION_COUNTER_1";
import { YARN_1 } from "../systems/revolution_counter_1/models/YARN_1";
import { ENV, loadEnv } from "../utils/loadEnv";

loadEnv();
async function createRevolutionCounter1() {
	const userId = "68caed034198910cd81ac9ec";

	// const yarn = await YARN_1.create({
	// 	userId: userId,
	// 	quality: "Quality 1",
	// 	countsPerRoll: 1000,
	// });

	const machine = await REVOLUTION_COUNTER_1.create({
		_id: new mongoose.Types.ObjectId("68d3b827bb3684fd34e56076"),
		orgId: "68caed034198910cd81ac9ec",
		name: "M2",
		location: "loc1",
		maxRpm: 45,
		setRpm: 22,
		yarn: "68eea9552c5827fc14de9fa0",
		shifts: [
			{
				shift: "68eea9712c5827fc14de9fab",
				operator: "68eea9322c5827fc14de9f7b",
				supervisor: "68eea91b2c5827fc14de9f6c",
			},
			{
				shift: "68eea97f2c5827fc14de9fb6",
				operator: "68eea9be2c5827fc14de9fc4",
				supervisor: "68eea91b2c5827fc14de9f6c",
			},
		],
	});

	console.log(machine, "created");
}

Db.connectMongoDB(ENV.MONGO_URI).then(() => {
	createRevolutionCounter1();
});
