import mongoose from "mongoose";

const schema = new mongoose.Schema(
	{
		name: { type: String, required: true },
		orgId: {
			// the organization's user id
			type: mongoose.Schema.Types.ObjectId,
			required: true,
			ref: "USER",
		},
		system: {
			// which system this ticket belongs to
			type: String,
			required: true,
		},
		features: [
			{
				type: String,
				required: true,
				// Features will be validated per system
			},
		],
	},
	{ timestamps: true }
);

export const TICKET =
	mongoose.models.TICKET || mongoose.model("TICKET", schema);
