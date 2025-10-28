import { Request, Response } from "express";
import { handler } from "../../../utils/handler";
import { AuthenticatedRequest } from "../../../utils/types";
import { log } from "console";
import { ForecastService } from "../services/ForecastService";
import { INDICATOR_3 } from "../models/INDICATOR_3";
import { SCENARIO_3 } from "../models/SCENARIO_3";
import type { DashboardSummary, TrendDataPoint, Indicator } from "../types";

export const get_all = handler(
	async (req: AuthenticatedRequest, res: Response) => {
		try {
			const { orgId, role } = req.user!.donear_3!;

			// Get latest forecast
			const latestForecast = await ForecastService.getLatestForecast(orgId);

			if (!latestForecast) {
				return res.json({
					error: "No published forecast found",
					totalForecast: { amount: 0, growthRate: 0, growthVsLastYear: 0 },
					growthRate: { value: 0, industryAvg: 0, difference: 0 },
					confidence: { level: 0, benchmarkDifference: 0 },
					trendData: [],
					indicators: [],
					activeScenario: null,
				});
			}

			// Get indicators for the latest forecast
			const indicators = (await INDICATOR_3.find({
				orgId,
				forecast: latestForecast._id,
			}).sort({ contribution: -1 })) as Indicator[];

			// Get active scenario
			const activeScenario = await SCENARIO_3.findOne({
				orgId,
				isActive: true,
			});

			// Get past 12 months of forecasts for trend data
			const endDate = new Date(latestForecast.period);
			const startDate = new Date(endDate);
			startDate.setMonth(startDate.getMonth() - 11);

			const historicalForecasts = await ForecastService.getForecastsByDateRange(
				orgId,
				startDate,
				endDate
			);

			// Generate trend data
			const trendData: TrendDataPoint[] = historicalForecasts.map(
				(forecast) => {
					const date = new Date(forecast.period);
					const monthNames = [
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
					const confidenceMargin =
						(forecast.totalAmount * (100 - forecast.confidence)) / 200;

					return {
						month: monthNames[date.getMonth()],
						date: forecast.period,
						value: Math.round(forecast.totalAmount * 100) / 100,
						confidenceInterval: {
							low:
								Math.round((forecast.totalAmount - confidenceMargin) * 100) /
								100,
							high:
								Math.round((forecast.totalAmount + confidenceMargin) * 100) /
								100,
						},
					};
				}
			);

			// Calculate growth vs last year
			const growthVsLastYear =
				latestForecast.previousYearAmount > 0
					? Math.round(
							((latestForecast.totalAmount -
								latestForecast.previousYearAmount) /
								latestForecast.previousYearAmount) *
								10000
					  ) / 100
					: 0;

			// Build dashboard summary
			const dashboardSummary: DashboardSummary = {
				totalForecast: {
					amount: Math.round(latestForecast.totalAmount * 100) / 100,
					growthRate: Math.round(latestForecast.growthRate * 100) / 100,
					growthVsLastYear: Math.round(growthVsLastYear * 100) / 100,
				},
				growthRate: {
					value: Math.round(latestForecast.growthRate * 100) / 100,
					industryAvg: Math.round(latestForecast.industryAvgGrowth * 100) / 100,
					difference:
						Math.round(
							(latestForecast.growthRate - latestForecast.industryAvgGrowth) *
								100
						) / 100,
				},
				confidence: {
					level: Math.round(latestForecast.confidence * 100) / 100,
					benchmarkDifference:
						Math.round(
							(latestForecast.confidence - latestForecast.benchmarkConfidence) *
								100
						) / 100,
				},
				trendData,
				indicators: indicators.map((ind) => ({
					...ind,
					value: Math.round(ind.value * 100) / 100,
					contribution: Math.round(ind.contribution * 100) / 100,
					weight: Math.round(ind.weight * 100) / 100,
				})),
				activeScenario: activeScenario?.toObject() || undefined,
			};

			res.json(dashboardSummary);
		} catch (error) {
			log("Error in donear_3/get_all:", error);
			res.json({
				error: "Failed to fetch dashboard data",
				totalForecast: { amount: 0, growthRate: 0, growthVsLastYear: 0 },
				growthRate: { value: 0, industryAvg: 0, difference: 0 },
				confidence: { level: 0, benchmarkDifference: 0 },
				trendData: [],
				indicators: [],
				activeScenario: null,
			});
		}
	}
);
