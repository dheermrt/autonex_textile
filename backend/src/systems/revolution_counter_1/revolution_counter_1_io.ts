import { Router, Request, Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../../utils/types";
import { get_all } from "./routes/get_all";
import { get_entities } from "./routes/get_entities";
import { create_update_machine } from "./routes/create_update_machine";
import { create_yarn } from "./routes/create_yarn";
import { create_operator } from "./routes/create_operator";
import { create_supervisor } from "./routes/create_supervisor";
import { delete_machine } from "./routes/delete_machine";
import { get_one } from "./routes/get_one";
import { create_needle_change_log } from "./routes/create_needle_change_log";
import { create_downtime_log } from "./routes/create_downtime_log";
import { get_downtime_logs } from "./routes/get_downtime_logs";
import { get_needle_change_logs } from "./routes/get_needle_change_logs";
import { get_shift_reports } from "./routes/get_shift_reports";
import { get_machine } from "./routes/get_machine";
import { create_shift } from "./routes/create_shift";
import { create_location } from "./routes/create_location";

export const featureRoutes = {
	create_downtime_log,
	create_location,
	create_needle_change_log,
	create_operator,
	create_shift,
	create_supervisor,
	create_update_machine,
	create_yarn,
	delete_machine,
	get_all,
	get_downtime_logs,
	get_entities,
	get_machine,
	get_needle_change_logs,
	get_one,
	get_shift_reports,
};

// Middleware to check revolution_counter_1 access
const checkAccess = (
	req: AuthenticatedRequest,
	res: Response,
	next: NextFunction
) => {
	if (!req.user?.revolution_counter_1) {
		return res
			.status(403)
			.json({ error: "Access denied to revolution_counter_1" });
	}
	next();
};

// Middleware to check feature access
const checkFeatureAccess = (featureName: string) => {
	return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
		const ticket = req.user?.revolution_counter_1?.ticket;
		if (!ticket?.features.includes(featureName)) {
			return res
				.status(403)
				.json({ error: `Feature ${featureName} not accessible` });
		}
		next();
	};
};

export const revolution_counter_1_router = () => {
	const router = Router();

	// Apply access check middleware to all routes
	router.use(checkAccess);

	// Register routes with feature access checks
	router.get("/get_all", checkFeatureAccess("get_all"), get_all);
	router.get("/get_entities", checkFeatureAccess("get_entities"), get_entities);
	router.post(
		"/create_update_machine",
		checkFeatureAccess("create_update_machine"),
		create_update_machine
	);
	router.post("/create_yarn", checkFeatureAccess("create_yarn"), create_yarn);
	router.post(
		"/create_operator",
		checkFeatureAccess("create_operator"),
		create_operator
	);
	router.post(
		"/create_supervisor",
		checkFeatureAccess("create_supervisor"),
		create_supervisor
	);
	router.delete(
		"/delete_machine",
		checkFeatureAccess("delete_machine"),
		delete_machine
	);
	router.get("/get_one", checkFeatureAccess("get_one"), get_one);
	router.post(
		"/create_needle_change_log",
		checkFeatureAccess("create_needle_change_log"),
		create_needle_change_log
	);
	router.post(
		"/create_downtime_log",
		checkFeatureAccess("create_downtime_log"),
		create_downtime_log
	);
	router.get(
		"/get_downtime_logs",
		checkFeatureAccess("get_downtime_logs"),
		get_downtime_logs
	);
	router.get(
		"/get_needle_change_logs",
		checkFeatureAccess("get_needle_change_logs"),
		get_needle_change_logs
	);
	router.get(
		"/get_shift_reports",
		checkFeatureAccess("get_shift_reports"),
		get_shift_reports
	);
	router.get("/get_machine", checkFeatureAccess("get_machine"), get_machine);
	router.post(
		"/create_shift",
		checkFeatureAccess("create_shift"),
		create_shift
	);
	router.post(
		"/create_location",
		checkFeatureAccess("create_location"),
		create_location
	);

	return router;
};
