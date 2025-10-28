import mongoose from "mongoose";

export const ShiftSchema = new mongoose.Schema(
	{
		name: { type: String, required: true },
		orgId: {
			type: mongoose.Schema.Types.ObjectId,
			required: true,
			ref: "USER",
		},
		start: {
			hour: { type: Number, min: 0, max: 23 },
			minute: { type: Number, min: 0, max: 59 },
		},
		end: {
			hour: { type: Number, min: 0, max: 23 },
			minute: { type: Number, min: 0, max: 59 },
		},
	},
	{ timestamps: true }
);

export const SHIFT_2 =
	mongoose.models.SHIFT_2 || mongoose.model("SHIFT_2", ShiftSchema);
