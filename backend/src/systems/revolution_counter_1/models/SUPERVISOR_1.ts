import mongoose from "mongoose";

const schema = new mongoose.Schema(
	{
		orgId: {
			type: mongoose.Schema.Types.ObjectId,
			required: true,
			ref: "USER",
		},
		user: {
			type: mongoose.Schema.Types.ObjectId,
			required: true,
			ref: "USER",
		},
	},
	{ timestamps: true }
);

export const SUPERVISOR_1 =
	mongoose.models.SUPERVISOR_1 || mongoose.model("SUPERVISOR_1", schema);
