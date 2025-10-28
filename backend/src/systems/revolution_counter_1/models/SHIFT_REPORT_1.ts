import mongoose from "mongoose";
import { ShiftSchema } from "./SHIFT_1";
import { YarnSchema } from "./YARN_1";

const schema = new mongoose.Schema({
	machine: {
		type: mongoose.Schema.Types.ObjectId,
		required: true,
		ref: "REVOLUTION_COUNTER_1",
	},
	orgId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "USER" },
	rpmAvg: { type: Number, required: true },
	rollInfo: {
		// won't change upon changing the yarn document
		yarn: { type: YarnSchema, required: true, _id: false, orgId: false },
		cumulativeCount: { type: Number, required: true },
		rolls: { type: Number, required: true },
	},
	idleTime: { type: Number, required: true }, // idle %, working time,
	shift: { type: ShiftSchema, required: true, _id: false, orgId: false },
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
	downtimeLogs: [
		{
			type: mongoose.Schema.Types.ObjectId,
			ref: "DOWNTIME_LOG_1",
		},
	],
	needleChangeLogs: [
		{
			type: mongoose.Schema.Types.ObjectId,
			ref: "NEEDLE_CHANGE_LOG_1",
		},
	],
	startTime: { type: Date, required: true }, // Actual start time from machine stats in Redis
	endTime: { type: Date, required: true }, // Full timestamp of shift end (when report is created)
	createdAt: { type: Date, default: Date.now },
});

// Ensure idempotency: one report per machine and shift window
schema.index({ machine: 1, startTime: 1, endTime: 1 }, { unique: true });

export const SHIFT_REPORT_1 =
	mongoose.models.SHIFT_REPORT_1 || mongoose.model("SHIFT_REPORT_1", schema);
