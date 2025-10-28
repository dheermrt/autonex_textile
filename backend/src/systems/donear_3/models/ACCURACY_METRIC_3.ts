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
		forecastAmount: {
			type: Number,
			required: true,
		},
		actualAmount: {
			type: Number,
			required: true,
		},
		accuracyPercentage: {
			type: Number,
			required: true,
			min: 0,
			max: 100,
		},
		variance: {
			type: Number,
			required: true,
		},
		variancePercentage: {
			type: Number,
			required: true,
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

export const ACCURACY_METRIC_3 =
	mongoose.models.ACCURACY_METRIC_3 ||
	mongoose.model("ACCURACY_METRIC_3", schema);




