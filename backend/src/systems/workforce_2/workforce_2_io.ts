import { Router, Request, Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../../utils/types";
import { get_all } from "./routes/get_all";
import { get_entities } from "./routes/get_entities";
import { create_update_area } from "./routes/create_update_area";
import { create_worker } from "./routes/create_worker";
import { create_supervisor } from "./routes/create_supervisor";
import { delete_area } from "./routes/delete_area";
import { get_one } from "./routes/get_one";
import { get_area } from "./routes/get_area";
import { create_shift } from "./routes/create_shift";
import { get_shift_reports } from "./routes/get_shift_reports";


export const featureRoutes = {
	create_shift,
	create_supervisor,
	create_update_area,
	create_worker,
	delete_area,
	get_all,
	get_area,
	get_entities,
	get_one,
	get_shift_reports,
};

// Middleware to check workforce_2 access
const checkAccess = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
	if (!req.user?.workforce_2) {
		return res.status(403).json({ error: "Access denied to workforce_2" });
	}
	next();
};

// Middleware to check feature access
const checkFeatureAccess = (featureName: string) => {
	return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
		const ticket = req.user?.workforce_2?.ticket;
		if (!ticket?.features.includes(featureName)) {
			return res.status(403).json({ error: `Feature ${featureName} not accessible` });
		}
		next();
	};
};

export const workforce_2_router = () => {
	const router = Router();
	
	// Apply access check middleware to all routes
	router.use(checkAccess);

	// Register routes with feature access checks
	router.get("/get_all", checkFeatureAccess("get_all"), get_all);
	router.get("/get_entities", checkFeatureAccess("get_entities"), get_entities);
	router.post("/create_update_area", checkFeatureAccess("create_update_area"), create_update_area);
	router.post("/create_worker", checkFeatureAccess("create_worker"), create_worker);
	router.post("/create_supervisor", checkFeatureAccess("create_supervisor"), create_supervisor);
	router.delete("/delete_area", checkFeatureAccess("delete_area"), delete_area);
	router.get("/get_one", checkFeatureAccess("get_one"), get_one);
	router.get("/get_area", checkFeatureAccess("get_area"), get_area);
	router.post("/create_shift", checkFeatureAccess("create_shift"), create_shift);
	router.get("/get_shift_reports", checkFeatureAccess("get_shift_reports"), get_shift_reports);

	return router;
};
