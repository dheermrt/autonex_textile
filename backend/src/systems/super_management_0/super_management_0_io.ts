import { Router, Request, Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../../utils/types";
import { get_users } from "./routes/get_users";
import { create_user } from "./routes/create_user";


// Middleware to check super_management_0 access
const checkAccess = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
	if (!req.user?.super_management_0) {
		return res.status(403).json({ error: "Access denied to super_management_0" });
	}
	next();
};

export const super_management_0_router = () => {
	const router = Router();
	
	// Apply access check middleware to all routes
	router.use(checkAccess);

	// Register routes
	router.get("/get_users", get_users);
	router.post("/create_user", create_user);

	return router;
};
