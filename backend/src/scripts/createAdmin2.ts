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
			name: "Admin2",
			email: "admin2@gmail.com",
			hashedPassword: await Crypt.hashPassword("123456"),
		});

		console.log("Admin2 created:", {
			_id: user._id,
			name: user.name,
			email: user.email,
		});

		// Step 2: Create a ticket with all features using the user's ID
		const ticket = await TICKET.create({
			name: "Admin Ticket",
			orgId: user._id,
			system: "workforce_2",
			features: [
				"create_update_ticket",
				"get_tickets",
				"create_worker",
				"create_shift",
				"create_supervisor",
				"create_update_area",
				"delete_area",
				"get_all",
				"get_entities",
				"get_area",
				"get_one",
				"get_shift_reports",
			],
		});

		console.log("Admin ticket created with all features:", ticket);

		// Step 3: Update the user to add the revolution_counter_1 field with the ticket
		const updatedUser = await USER.findByIdAndUpdate(
			user._id,
			{
				workforce_2: {
					orgId: user._id,
					role: "admin",
					ticket: ticket._id,
				},
			},
			{ new: true }
		);

		console.log("User updated with workforce_2:", {
			_id: updatedUser._id,
			name: updatedUser.name,
			email: updatedUser.email,
			workforce_2: updatedUser.workforce_2,
		});

		console.log("Admin user setup complete!");
		console.log("Login credentials:");
		console.log("Email: admin2@gmail.com");
		console.log("Password: admin123");
		console.log("User ID:", updatedUser._id);
		console.log("Role: admin");
		console.log("Ticket ID:", ticket._id);
	} catch (error) {
		console.error("Error creating admin user:", error);
	}
}

Db.connectMongoDB(ENV.MONGO_URI).then(() => {
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
