import mongoose from "mongoose";
import { FORECAST_3 } from "./models/FORECAST_3";
import { INDICATOR_3 } from "./models/INDICATOR_3";
import { SCENARIO_3 } from "./models/SCENARIO_3";
import { ACCURACY_METRIC_3 } from "./models/ACCURACY_METRIC_3";

export const registerModels = () => {
	if (!mongoose.models.FORECAST_3)
		mongoose.model("FORECAST_3", FORECAST_3.schema);
	if (!mongoose.models.INDICATOR_3)
		mongoose.model("INDICATOR_3", INDICATOR_3.schema);
	if (!mongoose.models.SCENARIO_3)
		mongoose.model("SCENARIO_3", SCENARIO_3.schema);
	if (!mongoose.models.ACCURACY_METRIC_3)
		mongoose.model("ACCURACY_METRIC_3", ACCURACY_METRIC_3.schema);
};

