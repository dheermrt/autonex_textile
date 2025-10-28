import mongoose from "mongoose";

const schema = new mongoose.Schema(
	{
		orgId: {
			type: mongoose.Schema.Types.ObjectId,
			required: true,
			ref: "USER",
		},
		name: { type: String, required: true },
		maxRcpm: { type: Number, required: true }, // Maximum rolls cleaned per minute
		setRcpm: { type: Number, required: true }, // Set rolls cleaned per minute
		shifts: [
			{
				type: {
					shift: {
						type: mongoose.Schema.Types.ObjectId,
						required: true,
						ref: "SHIFT_2",
					},
					worker: {
						type: mongoose.Schema.Types.ObjectId,
						required: true,
						ref: "WORKER_2",
					},
					supervisor: {
						type: mongoose.Schema.Types.ObjectId,
						required: true,
						ref: "SUPERVISOR_2",
					},
					_id: false, // prevent _id for this object
				},
			},
		],
	},
	{ timestamps: true }
);

export const AREA_2 =
	mongoose.models.AREA_2 ||
	mongoose.model("AREA_2", schema);
