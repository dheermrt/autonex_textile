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
		supervisor: {
			type: mongoose.Schema.Types.ObjectId,
			required: false, // Optional - some workers might not have supervisors
			ref: "SUPERVISOR_2",
		},
	},
	{ timestamps: true }
);

export const WORKER_2 =
	mongoose.models.WORKER_2 || mongoose.model("WORKER_2", schema);
