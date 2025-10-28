import mongoose from "mongoose";

const schema = new mongoose.Schema(
	{
		orgId: {
			type: mongoose.Schema.Types.ObjectId,
			required: true,
			ref: "USER",
		}, // the organization's user id
		user: {
			type: mongoose.Schema.Types.ObjectId,
			required: true,
			ref: "USER",
		},
		supervisor: {
			type: mongoose.Schema.Types.ObjectId,
			required: false, // Optional - some operators might not have supervisors
			ref: "SUPERVISOR_1",
		},
	},
	{ timestamps: true }
);

export const OPERATOR_1 =
	mongoose.models.OPERATOR_1 || mongoose.model("OPERATOR_1", schema);
