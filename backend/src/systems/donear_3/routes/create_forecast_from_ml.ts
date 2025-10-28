import { Request, Response } from "express";
import { handler } from "../../../utils/handler";
import { AuthenticatedRequest } from "../../../utils/types";
import { log } from "console";
import { z } from "zod";
import { assertZ } from "../../../utils/assertZ";
import { FORECAST_3 } from "../models/FORECAST_3";
import { INDICATOR_3 } from "../models/INDICATOR_3";
import { ForecastService } from "../services/ForecastService";

/**
 * Create forecast from ML model predictions
 *
 * This route accepts predictions from an ML model and creates:
 * 1. A forecast entry
 * 2. Associated indicators with their contributions
 *
 * The ML model should provide:
 * - Predicted revenue
 * - Growth rate
 * - Confidence score
 * - Feature importances (as indicators)
 */

const mlPredictionSchema = z.object({
	period: z.string().or(z.date()),
	predictions: z.object({
		totalAmount: z.number().positive(),
		growthRate: z.number(),
		confidence: z.number().min(0).max(100),
		industryAvgGrowth: z.number().optional().default(4.3),
		previousYearAmount: z.number().positive(),
	}),
	// Feature importances from ML model
	featureImportances: z
		.array(
			z.object({
				featureName: z.string(),
				importance: z.number().min(0).max(1), // Normalized importance (0-1)
				value: z.number(),
				trend: z.enum(["up", "down", "stable"]).optional().default("stable"),
				category: z.string().optional().default("Model Feature"),
			})
		)
		.optional(),
	modelMetadata: z
		.object({
			modelName: z.string().optional(),
			modelVersion: z.string().optional(),
			trainedOn: z.string().optional(),
			accuracy: z.number().optional(),
		})
		.optional(),
	autoPublish: z.boolean().optional().default(false),
	notes: z.string().optional(),
});

export const create_forecast_from_ml = handler(
	async (req: AuthenticatedRequest, res: Response) => {
		try {
			const { orgId, role } = req.user!.donear_3!;

			// Only admins can create forecasts from ML predictions
			if (!ForecastService.canModify(role)) {
				return res.status(403).json({ error: "Insufficient permissions" });
			}

			assertZ(mlPredictionSchema, req.body);

			const {
				period,
				predictions,
				featureImportances,
				modelMetadata,
				autoPublish,
				notes,
			} = req.body;

			// Construct notes with model metadata
			let forecastNotes = notes || "";
			if (modelMetadata) {
				forecastNotes += `\n\n[ML Model Prediction]`;
				if (modelMetadata.modelName) {
					forecastNotes += `\nModel: ${modelMetadata.modelName}`;
				}
				if (modelMetadata.modelVersion) {
					forecastNotes += `\nVersion: ${modelMetadata.modelVersion}`;
				}
				if (modelMetadata.trainedOn) {
					forecastNotes += `\nTrained On: ${modelMetadata.trainedOn}`;
				}
				if (modelMetadata.accuracy) {
					forecastNotes += `\nModel Accuracy: ${modelMetadata.accuracy}%`;
				}
			}

			// Calculate benchmark confidence (assume 85% if not using industry standard)
			const benchmarkConfidence = 85;

			// Create forecast from ML predictions
			const forecast = await FORECAST_3.create({
				orgId,
				period: new Date(period),
				totalAmount: predictions.totalAmount,
				growthRate: predictions.growthRate,
				confidence: predictions.confidence,
				industryAvgGrowth: predictions.industryAvgGrowth,
				benchmarkConfidence,
				previousYearAmount: predictions.previousYearAmount,
				status: autoPublish ? "published" : "draft",
				notes: forecastNotes.trim(),
			});

			log(
				`✓ Forecast created from ML model for period ${period}, ID: ${forecast._id}`
			);

			// Create indicators from feature importances
			const indicators = [];
			if (featureImportances && featureImportances.length > 0) {
				// Normalize importances and calculate contributions
				const totalImportance = featureImportances.reduce(
					(sum: number, f: { importance: number }) => sum + f.importance,
					0
				);

				// Color palette for indicators
				const colors = [
					"#FF6B6B",
					"#4ECDC4",
					"#45B7D1",
					"#96CEB4",
					"#FFEAA7",
					"#DFE6E9",
					"#74B9FF",
					"#A29BFE",
				];

				for (let i = 0; i < featureImportances.length; i++) {
					const feature = featureImportances[i];
					const normalizedWeight = feature.importance / totalImportance;

					// Calculate contribution as a portion of total forecast
					const contribution = predictions.totalAmount * normalizedWeight * 0.3; // 30% of total attributed to features

					const indicator = await INDICATOR_3.create({
						orgId,
						forecast: forecast._id,
						name: feature.featureName,
						category: feature.category,
						value: Math.round(feature.value * 100) / 100,
						contribution: Math.round(contribution * 100) / 100,
						weight: Math.round(normalizedWeight * 1000) / 1000,
						trend: feature.trend,
						color: colors[i % colors.length],
					});

					indicators.push(indicator);
				}

				log(
					`✓ Created ${indicators.length} indicators from feature importances`
				);
			}

			// Populate and return
			const populatedForecast = await FORECAST_3.findById(forecast._id);

			res.json({
				success: true,
				forecast: populatedForecast,
				indicators,
				message: `Forecast created from ML model for ${new Date(
					period
				).toLocaleDateString()}`,
			});
		} catch (error) {
			log("Error in donear_3/create_forecast_from_ml:", error);
			res
				.status(500)
				.json({ error: "Failed to create forecast from ML predictions" });
		}
	}
);
