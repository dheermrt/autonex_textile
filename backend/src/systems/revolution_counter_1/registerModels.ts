import mongoose from "mongoose";
import { DOWNTIME_LOG_1 } from "./models/DOWNTIME_LOG_1";
import { NEEDLE_CHANGE_LOG_1 } from "./models/NEEDLE_CHANGE_LOG_1";
import { OPERATOR_1 } from "./models/OPERATOR_1";
import { REVOLUTION_COUNTER_1 } from "./models/REVOLUTION_COUNTER_1";
import { SHIFT_1 } from "./models/SHIFT_1";
import { SHIFT_REPORT_1 } from "./models/SHIFT_REPORT_1";
import { SUPERVISOR_1 } from "./models/SUPERVISOR_1";
import { YARN_1 } from "./models/YARN_1";
import { LOCATION_1 } from "./models/LOCATION_1";

export const registerModels = () => {
	if (!mongoose.models.DOWNTIME_LOG_1)
		mongoose.model("DOWNTIME_LOG_1", DOWNTIME_LOG_1.schema);
	if (!mongoose.models.NEEDLE_CHANGE_LOG_1)
		mongoose.model("NEEDLE_CHANGE_LOG_1", NEEDLE_CHANGE_LOG_1.schema);
	if (!mongoose.models.OPERATOR_1)
		mongoose.model("OPERATOR_1", OPERATOR_1.schema);
	if (!mongoose.models.REVOLUTION_COUNTER_1)
		mongoose.model("REVOLUTION_COUNTER_1", REVOLUTION_COUNTER_1.schema);

	if (!mongoose.models.SHIFT_1) mongoose.model("SHIFT_1", SHIFT_1.schema);
	if (!mongoose.models.SHIFT_REPORT_1)
		mongoose.model("SHIFT_REPORT_1", SHIFT_REPORT_1.schema);
	if (!mongoose.models.SUPERVISOR_1)
		mongoose.model("SUPERVISOR_1", SUPERVISOR_1.schema);

	if (!mongoose.models.YARN_1) mongoose.model("YARN_1", YARN_1.schema);
	if (!mongoose.models.LOCATION_1)
		mongoose.model("LOCATION_1", LOCATION_1.schema);
};
