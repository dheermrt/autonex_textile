import { Router, Request, Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../../utils/types";
import { get_all } from "./routes/get_all";
import { get_forecast } from "./routes/get_forecast";
import { create_update_forecast } from "./routes/create_update_forecast";
import { create_forecast_from_ml } from "./routes/create_forecast_from_ml";
import { get_indicators } from "./routes/get_indicators";
import { create_update_indicator } from "./routes/create_update_indicator";
import { get_scenarios } from "./routes/get_scenarios";
import { create_update_scenario } from "./routes/create_update_scenario";
import { test_scenario } from "./routes/test_scenario";
import { get_accuracy_history } from "./routes/get_accuracy_history";


export const featureRoutes = {
	get_all,
	get_forecast,
	create_update_forecast,
	create_forecast_from_ml,
	get_indicators,
	create_update_indicator,
	get_scenarios,
	create_update_scenario,
	test_scenario,
	get_accuracy_history,
};

// Middleware to check donear_3 access
const checkAccess = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
	if (!req.user?.donear_3) {
		return res.status(403).json({ error: "Access denied to donear_3" });
	}
	next();
};

// Middleware to check feature access
const checkFeatureAccess = (featureName: string) => {
	return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
		const ticket = req.user?.donear_3?.ticket;
		if (!ticket?.features.includes(featureName)) {
			return res.status(403).json({ error: `Feature ${featureName} not accessible` });
		}
		next();
	};
};

export const donear_3_router = () => {
	const router = Router();
	
	// Apply access check middleware to all routes
	router.use(checkAccess);

	// Register routes with feature access checks
	router.get("/get_all", checkFeatureAccess("get_all"), get_all);
	router.get("/get_forecast", checkFeatureAccess("get_forecast"), get_forecast);
	router.post("/create_update_forecast", checkFeatureAccess("create_update_forecast"), create_update_forecast);
	router.post("/create_forecast_from_ml", checkFeatureAccess("create_forecast_from_ml"), create_forecast_from_ml);
	router.get("/get_indicators", checkFeatureAccess("get_indicators"), get_indicators);
	router.post("/create_update_indicator", checkFeatureAccess("create_update_indicator"), create_update_indicator);
	router.get("/get_scenarios", checkFeatureAccess("get_scenarios"), get_scenarios);
	router.post("/create_update_scenario", checkFeatureAccess("create_update_scenario"), create_update_scenario);
	router.post("/test_scenario", checkFeatureAccess("test_scenario"), test_scenario);
	router.get("/get_accuracy_history", checkFeatureAccess("get_accuracy_history"), get_accuracy_history);

	return router;
};
