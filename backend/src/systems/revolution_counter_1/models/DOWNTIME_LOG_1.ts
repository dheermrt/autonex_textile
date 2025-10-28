import mongoose from "mongoose";

const schema = new mongoose.Schema({
	orgId: { type: mongoose.Schema.Types.ObjectId, ref: "USER", required: true },
	machine: { 
		type: mongoose.Schema.Types.ObjectId, 
		required: true,
		ref: "REVOLUTION_COUNTER_1"
	},
	startTime: { type: Date, required: true },
	endTime: { type: Date, required: true },
	reason: { type: String, required: false },
	createdAt: { type: Date, default: Date.now },
});
export const DOWNTIME_LOG_1 = mongoose.models.DOWNTIME_LOG_1 || mongoose.model("DOWNTIME_LOG_1", schema);
