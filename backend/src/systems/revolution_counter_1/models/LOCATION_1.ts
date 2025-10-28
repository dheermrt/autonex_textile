import mongoose from "mongoose";

const schema = new mongoose.Schema(
	{
		orgId: {
			type: mongoose.Schema.Types.ObjectId,
			required: true,
			ref: "USER",
		},
		name: { type: String, required: true },
	},
	{ timestamps: true }
);

export const LOCATION_1 =
	mongoose.models.LOCATION_1 || mongoose.model("LOCATION_1", schema);
