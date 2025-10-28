import mongoose from "mongoose";

export const YarnSchema = new mongoose.Schema({
	orgId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "USER" },
	quality: { type: String, required: true },
	countsPerRoll: { type: Number, required: true },
	createdAt: { type: Date, default: Date.now },
});

export const YARN_1 =
	mongoose.models.YARN_1 || mongoose.model("YARN_1", YarnSchema);
