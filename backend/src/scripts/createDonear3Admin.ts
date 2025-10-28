/**
 * Script to create a Donear System admin user with sample forecast data
 * 
 * Usage: npm run create-donear-admin
 * 
 * This script creates:
 * 1. An admin user for Donear system
 * 2. A ticket with all features
 * 3. Sample forecast data with indicators
 * 4. Sample scenarios
 * 5. Sample accuracy history
 */

import { ENV, loadEnv } from "../utils/loadEnv";
import { Db } from "../modules/Db";
import { UserRepo } from "../User/UserRepo";
import { TICKET } from "../Ticket/TICKET";
import { FORECAST_3 } from "../systems/donear_3/models/FORECAST_3";
import { INDICATOR_3 } from "../systems/donear_3/models/INDICATOR_3";
import { SCENARIO_3 } from "../systems/donear_3/models/SCENARIO_3";
import { ACCURACY_METRIC_3 } from "../systems/donear_3/models/ACCURACY_METRIC_3";
import { log } from "console";

loadEnv();

async function createDonear3Admin() {
	try {
		// Connect to database
		await Db.connectMongoDB(ENV.MONGO_URI);

		// Create admin user (organization)
		const adminEmail = "donear-admin@example.com";
		const adminPassword = "admin123";

		log("Creating Donear admin user...");
		const admin = await UserRepo.createUser(
			"Donear Admin",
			adminEmail,
			adminPassword
		);
		log("✓ Admin user created:", admin);

		// Create ticket with all features
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

		log("Creating ticket...");
		const ticket = await TICKET.create({
			name: "Donear Full Access",
			orgId: admin._id,
			system: "donear_3",
			features: features,
		});
		log("✓ Ticket created:", ticket);

		// Update user with donear_3 system access
		log("Updating user with system access...");
		await UserRepo.addSystemToUser(
			admin._id,
			ticket._id,
			"donear_3"
		);
		
		// Manually set donear_3 field since addSystemToUser doesn't exist for this yet
		const { USER } = await import("../User/USER");
		await USER.findByIdAndUpdate(admin._id, {
			donear_3: {
				orgId: admin._id,
				role: "admin",
				ticket: ticket._id,
			},
		});
		log("✓ User updated with donear_3 access");

		// Create sample forecast data
		log("\nCreating sample forecast data...");
		const currentYear = new Date().getFullYear();
		const currentMonth = new Date().getMonth();

		// Create current forecast
		const currentForecast = await FORECAST_3.create({
			orgId: admin._id,
			period: new Date(currentYear, currentMonth, 1),
			totalAmount: 306.4, // 306.4 Cr
			growthRate: 7.7,
			confidence: 87,
			industryAvgGrowth: 4.3,
			benchmarkConfidence: 85.2,
			previousYearAmount: 284.7,
			status: "published",
			notes: "Q3 2024 forecast with strong market indicators",
		});
		log("✓ Current forecast created:", currentForecast.period);

		// Create leading indicators for current forecast
		log("\nCreating leading indicators...");
		const indicatorData = [
			{
				name: "Raw Material Cost",
				category: "Cost",
				value: 85,
				contribution: 45.2,
				weight: 0.25,
				trend: "up",
				color: "#FF6B6B",
			},
			{
				name: "Market Demand",
				category: "Market",
				value: 92,
				contribution: 58.7,
				weight: 0.30,
				trend: "up",
				color: "#4ECDC4",
			},
			{
				name: "Production Efficiency",
				category: "Internal",
				value: 88,
				contribution: 42.5,
				weight: 0.20,
				trend: "stable",
				color: "#45B7D1",
			},
			{
				name: "Export Orders",
				category: "Revenue",
				value: 78,
				contribution: 38.9,
				weight: 0.15,
				trend: "up",
				color: "#96CEB4",
			},
			{
				name: "Inventory Turnover",
				category: "Efficiency",
				value: 82,
				contribution: 35.4,
				weight: 0.10,
				trend: "stable",
				color: "#FFEAA7",
			},
		];

		for (const ind of indicatorData) {
			await INDICATOR_3.create({
				orgId: admin._id,
				forecast: currentForecast._id,
				...ind,
			});
		}
		log(`✓ Created ${indicatorData.length} indicators`);

		// Create sample scenarios
		log("\nCreating sample scenarios...");
		
		// Base scenario (current settings)
		await SCENARIO_3.create({
			orgId: admin._id,
			name: "Base Case",
			description: "Current market conditions with normal cotton prices",
			parameters: {
				cottonPriceIndex: 50,
				marketDemandIndex: 50,
			},
			impact: {
				adjustedRevenue: 306.4,
				revenueChange: 0,
				adjustedGrowth: 7.7,
			},
			isActive: true,
		});

		// Optimistic scenario
		await SCENARIO_3.create({
			orgId: admin._id,
			name: "Optimistic Growth",
			description: "High demand with stable cotton prices",
			parameters: {
				cottonPriceIndex: 45,
				marketDemandIndex: 75,
			},
			impact: {
				adjustedRevenue: 319.8,
				revenueChange: 13.4,
				adjustedGrowth: 12.4,
			},
			isActive: false,
		});

		// Pessimistic scenario
		await SCENARIO_3.create({
			orgId: admin._id,
			name: "Market Downturn",
			description: "Rising cotton prices with lower demand",
			parameters: {
				cottonPriceIndex: 70,
				marketDemandIndex: 35,
			},
			impact: {
				adjustedRevenue: 289.2,
				revenueChange: -17.2,
				adjustedGrowth: 1.6,
			},
			isActive: false,
		});
		log("✓ Created 3 scenarios");

		// Create historical accuracy data
		log("\nCreating historical accuracy metrics...");
		const months = 12;
		for (let i = 1; i <= months; i++) {
			const period = new Date(currentYear, currentMonth - i, 1);
			const forecastAmount = 280 + i * 2; // Incremental growth
			const actual = forecastAmount * (0.95 + Math.random() * 0.1); // ±5% variance
			const variance = actual - forecastAmount;
			const variancePercentage = (variance / forecastAmount) * 100;
			const accuracy = Math.max(0, 100 - Math.abs(variancePercentage));

			await ACCURACY_METRIC_3.create({
				orgId: admin._id,
				period,
				forecastAmount,
				actualAmount: Math.round(actual * 100) / 100,
				accuracyPercentage: Math.round(accuracy * 100) / 100,
				variance: Math.round(variance * 100) / 100,
				variancePercentage: Math.round(variancePercentage * 100) / 100,
				notes: `Forecast vs Actual for ${period.toLocaleDateString()}`,
			});
		}
		log(`✓ Created ${months} months of accuracy history`);

		// Create additional forecasts for trend data
		log("\nCreating additional forecasts for trend...");
		for (let i = 1; i <= 6; i++) {
			await FORECAST_3.create({
				orgId: admin._id,
				period: new Date(currentYear, currentMonth - i, 1),
				totalAmount: 306.4 - i * 3.5,
				growthRate: 7.7 - i * 0.3,
				confidence: 87 - i * 1,
				industryAvgGrowth: 4.3,
				benchmarkConfidence: 85.2,
				previousYearAmount: 284.7 - i * 3.5,
				status: "published",
				notes: `Historical forecast ${i} months ago`,
			});
		}
		log("✓ Created 6 historical forecasts");

		// Summary
		log("\n" + "=".repeat(50));
		log("✓ Donear System Setup Complete!");
		log("=".repeat(50));
		log("\n📧 Login Credentials:");
		log(`   Email: ${adminEmail}`);
		log(`   Password: ${adminPassword}`);
		log("\n📊 Sample Data Created:");
		log(`   - ${months + 1} Forecasts (1 current + ${months - 5} historical)`);
		log(`   - ${indicatorData.length} Leading Indicators`);
		log(`   - 3 Scenarios (1 active)`);
		log(`   - ${months} Accuracy Metrics`);
		log("\n🔧 Socket.IO Events Available:");
		log("   - donear_3/get_all");
		log("   - donear_3/get_forecast");
		log("   - donear_3/create_update_forecast");
		log("   - donear_3/get_indicators");
		log("   - donear_3/create_update_indicator");
		log("   - donear_3/get_scenarios");
		log("   - donear_3/create_update_scenario");
		log("   - donear_3/test_scenario");
		log("   - donear_3/get_accuracy_history");
		log("\n");

		process.exit(0);
	} catch (error) {
		console.error("❌ Error creating Donear admin:", error);
		process.exit(1);
	}
}

createDonear3Admin();
