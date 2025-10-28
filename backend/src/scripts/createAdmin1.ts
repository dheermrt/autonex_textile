import { USER } from "../User/USER";
import { TICKET } from "../Ticket/TICKET";
import { Db } from "../modules/Db";
import { ENV, loadEnv } from "../utils/loadEnv";
import { Crypt } from "../modules/Crypt";

loadEnv();

async function createAdminUser() {
	try {
		// Step 1: Create the admin user first (without custom ID)
		const user = await USER.create({
			_id: "68caed034198910cd81ac9ec",
			name: "Patodia",
			email: "patodia@gmail.com",
			hashedPassword: await Crypt.hashPassword("123456"),
		});

		console.log("Patodia created:", {
			_id: user._id,
			name: user.name,
			email: user.email,
		});

		// Step 2: Create a ticket with all features using the user's ID
		const ticket = await TICKET.create({
			name: "Admin Ticket",
			orgId: user._id,
			system: "revolution_counter_1",
			features: [
				"create_downtime_log",
				"create_needle_change_log",
				"create_operator",
				"create_shift",
				"create_supervisor",
				"create_update_ticket",
				"create_update_machine",
				"create_yarn",
				"delete_machine",
				"get_all",
				"get_downtime_logs",
				"get_entities",
				"get_machine",
				"get_needle_change_logs",
				"get_one",
				"get_shift_reports",
				"get_tickets",
			],
		});

		console.log("Admin ticket created with all features:", ticket);

		// Step 3: Update the user to add the revolution_counter_1 field with the ticket
		const updatedUser = await USER.findByIdAndUpdate(
			user._id,
			{
				revolution_counter_1: {
					orgId: user._id,
					role: "admin",
					ticket: ticket._id,
				},
			},
			{ new: true }
		);

		console.log("User updated with revolution_counter_1:", {
			_id: updatedUser._id,
			name: updatedUser.name,
			email: updatedUser.email,
			revolution_counter_1: updatedUser.revolution_counter_1,
		});

		console.log("Admin user setup complete!");
		console.log("Login credentials:");
		console.log("Email: admin@autonex.com");
		console.log("Password: admin123");
		console.log("User ID:", updatedUser._id);
		console.log("Role: admin");
		console.log("Ticket ID:", ticket._id);
	} catch (error) {
		console.error("Error creating admin user:", error);
	}
}

const MONGO_URI = ENV.MONGO_URI;
Db.connectMongoDB(MONGO_URI).then(() => {
	console.log("Connected to MongoDB:");
	createAdminUser()
		.then(() => {
			process.exit(0);
		})
		.catch((error) => {
			console.error("Script failed:", error);
			process.exit(1);
		});
});
