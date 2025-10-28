import mongoose from "mongoose";

const schema = new mongoose.Schema(
	{
		orgId: {
			type: mongoose.Schema.Types.ObjectId,
			required: true,
			ref: "USER",
		},
		forecast: {
			type: mongoose.Schema.Types.ObjectId,
			required: true,
			ref: "FORECAST_3",
		},
		name: {
			type: String,
			required: true,
		},
		category: {
			type: String,
			required: true,
		},
		value: {
			type: Number,
			required: true,
		},
		contribution: {
			type: Number,
			required: true,
		},
		weight: {
			type: Number,
			required: true,
			min: 0,
			max: 1,
		},
		trend: {
			type: String,
			enum: ["up", "down", "stable"],
			required: true,
		},
		color: {
			type: String,
			required: false,
		},
	},
	{ timestamps: true }
);

// Index for efficient querying
schema.index({ orgId: 1, forecast: 1 });

export const INDICATOR_3 =
	mongoose.models.INDICATOR_3 || mongoose.model("INDICATOR_3", schema);




