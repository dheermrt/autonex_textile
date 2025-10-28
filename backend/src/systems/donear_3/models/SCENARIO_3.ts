import mongoose from "mongoose";

const schema = new mongoose.Schema(
	{
		orgId: {
			type: mongoose.Schema.Types.ObjectId,
			required: true,
			ref: "USER",
		},
		name: {
			type: String,
			required: true,
		},
		description: {
			type: String,
			required: false,
		},
		parameters: {
			type: {
				cottonPriceIndex: {
					type: Number,
					required: true,
					min: 0,
					max: 100,
				},
				marketDemandIndex: {
					type: Number,
					required: true,
					min: 0,
					max: 100,
				},
				customFactors: {
					type: Map,
					of: Number,
					required: false,
				},
			},
			required: true,
		},
		impact: {
			type: {
				adjustedRevenue: {
					type: Number,
					required: true,
				},
				revenueChange: {
					type: Number,
					required: true,
				},
				adjustedGrowth: {
					type: Number,
					required: true,
				},
			},
			required: true,
		},
		isActive: {
			type: Boolean,
			default: false,
		},
	},
	{ timestamps: true }
);

// Index for efficient querying
schema.index({ orgId: 1, isActive: 1 });

export const SCENARIO_3 =
	mongoose.models.SCENARIO_3 || mongoose.model("SCENARIO_3", schema);




