import mongoose from "mongoose";

const schema = new mongoose.Schema(
	{
		orgId: {
			type: mongoose.Schema.Types.ObjectId,
			required: true,
			ref: "USER",
		},
		period: {
			type: Date,
			required: true,
		},
		totalAmount: {
			type: Number,
			required: true,
		},
		growthRate: {
			type: Number,
			required: true,
		},
		confidence: {
			type: Number,
			required: true,
			min: 0,
			max: 100,
		},
		industryAvgGrowth: {
			type: Number,
			required: true,
		},
		benchmarkConfidence: {
			type: Number,
			required: true,
			min: 0,
			max: 100,
		},
		previousYearAmount: {
			type: Number,
			required: true,
		},
		status: {
			type: String,
			enum: ["draft", "published", "archived"],
			default: "draft",
		},
		notes: {
			type: String,
			required: false,
		},
	},
	{ timestamps: true }
);

// Index for efficient querying by orgId and period
schema.index({ orgId: 1, period: -1 });

export const FORECAST_3 =
	mongoose.models.FORECAST_3 || mongoose.model("FORECAST_3", schema);




