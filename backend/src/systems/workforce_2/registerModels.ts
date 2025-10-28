import mongoose from "mongoose";
import { AREA_2 } from "./models/AREA_2";
import { WORKER_2 } from "./models/WORKER_2";
import { SUPERVISOR_2 } from "./models/SUPERVISOR_2";
import { SHIFT_2 } from "./models/SHIFT_2";
import { SHIFT_REPORT_2 } from "./models/SHIFT_REPORT_2";

export const registerModels = () => {
	if (!mongoose.models.AREA_2)
		mongoose.model("AREA_2", AREA_2.schema);
	if (!mongoose.models.WORKER_2)
		mongoose.model("WORKER_2", WORKER_2.schema);
	if (!mongoose.models.SUPERVISOR_2)
		mongoose.model("SUPERVISOR_2", SUPERVISOR_2.schema);
	if (!mongoose.models.SHIFT_2) 
		mongoose.model("SHIFT_2", SHIFT_2.schema);
	if (!mongoose.models.SHIFT_REPORT_2)
		mongoose.model("SHIFT_REPORT_2", SHIFT_REPORT_2.schema);
};
