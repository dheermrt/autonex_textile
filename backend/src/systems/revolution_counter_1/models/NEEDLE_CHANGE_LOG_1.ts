import mongoose from "mongoose";

const schema = new mongoose.Schema({
	orgId: { type: mongoose.Schema.Types.ObjectId, ref: "USER", required: true },
	machine: {
		type: mongoose.Schema.Types.ObjectId,
		required: true,
		ref: "REVOLUTION_COUNTER_1",
	},
	notes: { type: String, required: false },
	createdAt: { type: Date, default: Date.now },
});

export const NEEDLE_CHANGE_LOG_1 =
	mongoose.models.NEEDLE_CHANGE_LOG_1 ||
	mongoose.model("NEEDLE_CHANGE_LOG_1", schema);
