import mongoose from "mongoose";
import { ShiftSchema } from "./SHIFT_2";

const schema = new mongoose.Schema({
	area: {
		type: mongoose.Schema.Types.ObjectId,
		required: true,
		ref: "AREA_2",
	},
	orgId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "USER" },
	rcpmAvg: { type: Number, required: true }, // Rolls cleaned per minute average
	rollInfo: {
		in: { type: Number, required: true }, // Total rolls that came to the table
		count: { type: Number, required: true }, // Number of rolls cleaned out of in
	},
	shift: { type: ShiftSchema, required: true, _id: false, orgId: false },
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
	startTime: { type: Date, required: true },
	endTime: { type: Date, required: true },
	createdAt: { type: Date, default: Date.now },
});

schema.index({ area: 1, startTime: 1, endTime: 1 }, { unique: true });

export const SHIFT_REPORT_2 =
	mongoose.models.SHIFT_REPORT_2 || mongoose.model("SHIFT_REPORT_2", schema);
