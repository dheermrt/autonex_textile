import { FORECAST_3 } from "../models/FORECAST_3";
import type { Forecast } from "../types";

/**
 * ForecastService - Optimized Forecast Access and Fetching
 * 
 * This service provides efficient role-based forecast operations.
 * 
 * OPTIMIZATION STRATEGY:
 * - Single Operation: Access check + fetch in one database query
 * - Role-Based Logic:
 *   - Admin: Full access to all forecasts in organization
 *   - Analyst: Read-only access to published forecasts
 *   - Viewer: Read-only access to published forecasts
 * 
 * PERFORMANCE BENEFITS:
 * - Eliminates separate access validation + fetch operations
 * - Reduces database round trips
 * - Returns null if no access (no exceptions needed)
 */

export class ForecastService {
	/**
	 * Get a single forecast if user has access
	 * @param userId - The user's ID
	 * @param orgId - The organization ID
	 * @param role - The user's role (admin, analyst, viewer)
	 * @param forecastId - The forecast ID to fetch
	 * @returns Promise<Forecast | null> - The forecast if accessible, null otherwise
	 */
	static async getForecast(
		userId: string,
		orgId: string,
		role: string,
		forecastId: string
	): Promise<Forecast | null> {
		let forecast: Forecast | null = null;

		switch (role) {
			case "admin":
				// Admin: Full access to all forecasts
				forecast = await FORECAST_3.findOne({
					_id: forecastId,
					orgId: orgId.toString(),
				});
				break;

			case "analyst":
			case "viewer":
				// Analyst/Viewer: Only published forecasts
				forecast = await FORECAST_3.findOne({
					_id: forecastId,
					orgId: orgId.toString(),
					status: "published",
				});
				break;
		}

		return forecast;
	}

	/**
	 * Get all accessible forecasts for a user
	 * @param userId - The user's ID
	 * @param orgId - The organization ID
	 * @param role - The user's role (admin, analyst, viewer)
	 * @param limit - Optional limit for number of forecasts
	 * @returns Promise<Forecast[]> - Array of accessible forecasts
	 */
	static async getAllForecasts(
		userId: string,
		orgId: string,
		role: string,
		limit?: number
	): Promise<Forecast[]> {
		let forecasts: Forecast[] = [];

		const query = FORECAST_3.find({
			orgId: orgId.toString(),
			...(role !== "admin" && { status: "published" }),
		})
			.sort({ period: -1 })
			.limit(limit || 100);

		forecasts = await query;

		return forecasts;
	}

	/**
	 * Get latest published forecast
	 * @param orgId - The organization ID
	 * @returns Promise<Forecast | null> - The latest forecast
	 */
	static async getLatestForecast(orgId: string): Promise<Forecast | null> {
		const forecast = await FORECAST_3.findOne({
			orgId: orgId.toString(),
			status: "published",
		})
			.sort({ period: -1 })
			.limit(1);

		return forecast;
	}

	/**
	 * Get forecasts for a specific period range
	 * @param orgId - The organization ID
	 * @param startDate - Start date
	 * @param endDate - End date
	 * @returns Promise<Forecast[]> - Array of forecasts
	 */
	static async getForecastsByDateRange(
		orgId: string,
		startDate: Date,
		endDate: Date
	): Promise<Forecast[]> {
		const forecasts = await FORECAST_3.find({
			orgId: orgId.toString(),
			period: {
				$gte: startDate,
				$lte: endDate,
			},
			status: "published",
		}).sort({ period: 1 });

		return forecasts;
	}

	/**
	 * Check if user can modify forecast
	 * @param role - The user's role
	 * @returns boolean - True if user can modify
	 */
	static canModify(role: string): boolean {
		return role === "admin";
	}
}




