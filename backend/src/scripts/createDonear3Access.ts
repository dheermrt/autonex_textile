/**
 * Script to add Donear_3 access to existing user
 * This updates an existing user with donear_3 system access
 */

import mongoose from "mongoose";
import { config } from "dotenv";
import { log } from "console";
import { ENV } from "../utils/loadEnv";

// Load env without importing index.ts
config({ quiet: true });

const MONGO_URI = ENV.MONGO_URI;

if (!MONGO_URI) {
	console.error("❌ MONGO_URI not found in .env file");
	process.exit(1);
}

// Import models
const UserSchema = new mongoose.Schema(
	{
		name: { type: String, required: true },
		email: { type: String, required: true, unique: true },
		hashedPassword: { type: String, required: true },
		donear_3: {
			type: {
				orgId: {
					type: mongoose.Schema.Types.ObjectId,
					required: true,
					ref: "USER",
				},
				role: {
					type: String,
					required: true,
					enum: ["admin", "analyst", "viewer"],
				},
				ticket: {
					type: mongoose.Schema.Types.ObjectId,
					required: true,
					ref: "TICKET",
				},
			},
			required: false,
		},
	},
	{ timestamps: true }
);

const TicketSchema = new mongoose.Schema(
	{
		name: { type: String, required: true },
		orgId: {
			type: mongoose.Schema.Types.ObjectId,
			required: true,
			ref: "USER",
		},
		system: {
			type: String,
			required: true,
			enum: ["revolution_counter_1", "workforce_2", "donear_3"],
		},
		features: [
			{
				type: String,
				required: true,
			},
		],
	},
	{ timestamps: true }
);

const USER = mongoose.models.USER || mongoose.model("USER", UserSchema);
const TICKET = mongoose.models.TICKET || mongoose.model("TICKET", TicketSchema);

async function addDonear3Access() {
	try {
		// Connect to database
		log("Connecting to MongoDB...");
		await mongoose.connect(MONGO_URI!);

		const userEmail = "donear-admin@example.com";

		log(`\n🔍 Looking for user: ${userEmail}...`);
		
		// Find the user
		const user = await USER.findOne({ email: userEmail });

		if (!user) {
			console.error(`❌ User ${userEmail} not found!`);
			console.log("   Run: npm run create-donear-admin");
			process.exit(1);
		}

		log(`✓ User found: ${user.name}`);

		// Check if user already has donear_3 access
		if (user.donear_3) {
			log(`✓ User already has donear_3 access!`);
			log(`   Role: ${user.donear_3.role}`);
			log(`   Ticket ID: ${user.donear_3.ticket}`);
			console.log("\n✅ User is ready to access Donear system!");
			process.exit(0);
		}

		// Create or find ticket with all features
		log("\n📋 Setting up donear_3 ticket...");
		
		const features = [
			"get_all",
			"get_forecast",
			"create_update_forecast",
			"create_forecast_from_ml",
			"get_indicators",
			"create_update_indicator",
			"get_scenarios",
			"create_update_scenario",
			"test_scenario",
			"get_accuracy_history",
			"create_update_ticket",
			"get_tickets",
		];

		// Find or create ticket
		let ticket = await TICKET.findOne({
			orgId: user._id,
			system: "donear_3",
		});

		if (!ticket) {
			ticket = await TICKET.create({
				name: "Donear Full Access",
				orgId: user._id,
				system: "donear_3",
				features: features,
			});
			log("✓ Created new ticket");
		} else {
			log("✓ Using existing ticket");
		}

		// Update user with donear_3 access
		log("\n🔧 Adding donear_3 access to user...");
		
		await USER.findByIdAndUpdate(user._id, {
			donear_3: {
				orgId: user._id,
				role: "admin",
				ticket: ticket._id,
			},
		});

		log("✓ User updated with donear_3 access!");

		// Verify
		const updatedUser = await USER.findById(user._id)
			.populate("donear_3.ticket");

		console.log("\n" + "=".repeat(50));
		console.log("✅ Donear_3 Access Configured!");
		console.log("=".repeat(50));
		console.log("\n📧 Login Credentials:");
		console.log(`   Email: ${userEmail}`);
		console.log(`   Password: admin123`);
		console.log("\n🎯 Access Details:");
		console.log(`   System: donear_3`);
		console.log(`   Role: ${updatedUser.donear_3.role}`);
		console.log(`   Features: ${features.length} available`);
		console.log("\n🚀 You can now access the Donear system!");
		console.log("\n");

		process.exit(0);
	} catch (error) {
		console.error("❌ Error adding donear_3 access:", error);
		process.exit(1);
	}
}

addDonear3Access();
