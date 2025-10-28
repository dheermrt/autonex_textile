import { Db } from "../modules/Db";
import { SETTINGS } from "../systems/SETTINGS";
import { TICKET } from "../Ticket/TICKET";
import { ticketFeatures } from "../Ticket/ticket_io";
import { USER } from "../User/USER";
import { UserRepo } from "../User/UserRepo";
import { ENV, loadEnv } from "../utils/loadEnv";

loadEnv();

async function createSuperManager0() {
	const user = await UserRepo.createUser(
		"super_manager_0",
		"super_manager_0@gmail.com",
		"123456"
	);

	const revCounter1Ticket = await TICKET.create({
		name: "Revolution Counter Ticket",
		orgId: user._id,
		system: "revolution_counter_1",
		features: [...SETTINGS.revolution_counter_1.features, ...ticketFeatures],
	});
	const workforce2Ticket = await TICKET.create({
		name: "Workforce 2 Ticket",
		orgId: user._id,
		system: "workforce_2",
		features: [...SETTINGS.workforce_2.features, ...ticketFeatures],
	});
	const donear3Ticket = await TICKET.create({
		name: "Donear 3 Ticket",
		orgId: user._id,
		system: "donear_3",
		features: [...SETTINGS.donear_3.features, ...ticketFeatures],
	});
	const updatedUser = await USER.findByIdAndUpdate(
		user._id,
		{
			$set: {
				super_management_0: true,
				revolution_counter_1: {
					orgId: user._id,
					role: "admin",
					ticket: revCounter1Ticket._id,
				},
				workforce_2: {
					orgId: user._id,
					role: "admin",
					ticket: workforce2Ticket._id,
				},
				donear_3: {
					orgId: user._id,
					role: "admin",
					ticket: donear3Ticket._id,
				},
			},
		},
		{ new: true }
	);
	console.log(updatedUser);
}
Db.connectMongoDB(ENV.MONGO_URI)
	.then(() => {
		createSuperManager0();
	})
	.catch((error) => {
		console.error("Error connecting to MongoDB", error);
		process.exit(1);
	});
