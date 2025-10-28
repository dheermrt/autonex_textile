import type { Scenario, TrendDataPoint } from "../types";

/**
 * Calculate scenario impact on forecast
 * @param baseForecast - Base forecast amount
 * @param cottonPriceIndex - Cotton price index (0-100, 50 is normal)
 * @param marketDemandIndex - Market demand index (0-100, 50 is normal)
 * @returns Scenario impact data
 */
export function calculateScenarioImpact(
	baseForecast: number,
	cottonPriceIndex: number,
	marketDemandIndex: number
): Scenario["impact"] {
	// Cotton price impact: Higher prices = lower margin = slight revenue decrease
	// Assumption: 10 points above 50 = -2% revenue
	const cottonImpact = ((50 - cottonPriceIndex) / 50) * 0.04; // Max ±4%

	// Market demand impact: Higher demand = higher revenue
	// Assumption: 10 points above 50 = +3% revenue
	const demandImpact = ((marketDemandIndex - 50) / 50) * 0.06; // Max ±6%

	// Combined impact
	const totalImpact = cottonImpact + demandImpact;
	const adjustedRevenue = baseForecast * (1 + totalImpact);
	const revenueChange = adjustedRevenue - baseForecast;

	// Calculate adjusted growth
	const baseGrowth = 7.7; // From base forecast
	const adjustedGrowth = baseGrowth + totalImpact * 100;

	return {
		adjustedRevenue: Math.round(adjustedRevenue * 100) / 100,
		revenueChange: Math.round(revenueChange * 100) / 100,
		adjustedGrowth: Math.round(adjustedGrowth * 100) / 100,
	};
}

/**
 * Generate trend data points for the next 12 months
 * @param baseForecast - Current forecast amount
 * @param growthRate - Annual growth rate
 * @returns Array of trend data points
 */
export function generateTrendData(
	baseForecast: number,
	growthRate: number
): TrendDataPoint[] {
	const months = [
		"Jan",
		"Feb",
		"Mar",
		"Apr",
		"May",
		"Jun",
		"Jul",
		"Aug",
		"Sep",
		"Oct",
		"Nov",
		"Dec",
	];

	const startDate = new Date();
	startDate.setMonth(startDate.getMonth() - 6); // Start 6 months ago

	const dataPoints: TrendDataPoint[] = [];
	const monthlyGrowth = growthRate / 12; // Distribute annual growth across months

	for (let i = 0; i < 12; i++) {
		const currentDate = new Date(startDate);
		currentDate.setMonth(startDate.getMonth() + i);

		const monthIndex = currentDate.getMonth();
		const value = baseForecast * (1 + (monthlyGrowth * i) / 100);

		// Add some variance for confidence intervals (±5%)
		const variance = value * 0.05;

		dataPoints.push({
			month: months[monthIndex],
			date: currentDate,
			value: Math.round(value * 100) / 100,
			confidenceInterval: {
				low: Math.round((value - variance) * 100) / 100,
				high: Math.round((value + variance) * 100) / 100,
			},
		});
	}

	return dataPoints;
}

/**
 * Calculate accuracy percentage between forecast and actual
 * @param forecast - Forecasted amount
 * @param actual - Actual amount
 * @returns Accuracy percentage (0-100)
 */
export function calculateAccuracy(forecast: number, actual: number): number {
	const variance = Math.abs(forecast - actual);
	const variancePercentage = (variance / forecast) * 100;
	const accuracy = Math.max(0, 100 - variancePercentage);

	return Math.round(accuracy * 100) / 100;
}

/**
 * Calculate variance metrics
 * @param forecast - Forecasted amount
 * @param actual - Actual amount
 * @returns Variance and variance percentage
 */
export function calculateVariance(
	forecast: number,
	actual: number
): { variance: number; variancePercentage: number } {
	const variance = actual - forecast;
	const variancePercentage = (variance / forecast) * 100;

	return {
		variance: Math.round(variance * 100) / 100,
		variancePercentage: Math.round(variancePercentage * 100) / 100,
	};
}




