import mongoose from "mongoose";

const schema = new mongoose.Schema(
	{
		orgId: {
			type: mongoose.Schema.Types.ObjectId,
			required: true,
			ref: "USER",
		},
		name: { type: String, required: true },
		location: {
			type: mongoose.Schema.Types.ObjectId,
			required: true,
			ref: "LOCATION_1",
		},
		maxRpm: { type: Number, required: true },
		setRpm: { type: Number, required: true },
		yarn: {
			type: mongoose.Schema.Types.ObjectId,
			required: true,
			ref: "YARN_1",
		},
		shifts: [
			{
				type: {
					shift: {
						type: mongoose.Schema.Types.ObjectId,
						required: true,
						ref: "SHIFT_1",
					},
					operator: {
						type: mongoose.Schema.Types.ObjectId,
						required: true,
						ref: "OPERATOR_1",
					},
					supervisor: {
						type: mongoose.Schema.Types.ObjectId,
						required: true,
						ref: "SUPERVISOR_1",
					},
					_id: false, // prevent _id for this object
				},
			},
		],
		lastNeedleChange: {
			type: mongoose.Schema.Types.ObjectId,
			required: false,
			ref: "NEEDLE_CHANGE_LOG_1",
		},
	},
	{ timestamps: true }
);

export const REVOLUTION_COUNTER_1 =
	mongoose.models.REVOLUTION_COUNTER_1 ||
	mongoose.model("REVOLUTION_COUNTER_1", schema);
