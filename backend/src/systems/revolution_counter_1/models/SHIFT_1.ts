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

export const SHIFT_1 =
	mongoose.models.SHIFT_1 || mongoose.model("SHIFT_1", ShiftSchema);
