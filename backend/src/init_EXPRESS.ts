import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { log } from "console";
import { revolution_counter_1_router } from "./systems/revolution_counter_1/revolution_counter_1_io";
import { workforce_2_router } from "./systems/workforce_2/workforce_2_io";
import { donear_3_router } from "./systems/donear_3/donear_3_io";
import { super_management_0_router } from "./systems/super_management_0/super_management_0_io";
import { ticket_router } from "./Ticket/ticket_io";
import { auth_wall } from "./auth/auth_wall";
import { login_c } from "./auth/login_c";
import { logout_c } from "./auth/logout_c";
import { AuthenticatedRequest } from "./utils/types";

export const init_EXPRESS = ({ originArray }: { originArray: string[] }) => {
	const app = express();

	// Middleware
	app.use(
		cors({
			origin: originArray,
			credentials: true,
		})
	);
	app.use(express.json());
	app.use(cookieParser());

	// Health check endpoint
	app.get("/health", (req: Request, res: Response) => {
		res.json({ status: "ok", timestamp: new Date().toISOString() });
	});

	// Auth routes (no auth required)
	app.post("/api/auth/login", login_c);
	app.post("/api/auth/logout", logout_c);

	// Authentication middleware for protected routes
	app.use("/api", auth_wall);

	app.get("/api/me", (req: Request, res: Response) => {
		const authReq = req as AuthenticatedRequest;
		res.json(authReq.user);
	});

	// System routers with authentication
	app.use("/api/super_management_0", super_management_0_router());
	app.use("/api/revolution_counter_1", revolution_counter_1_router());
	app.use("/api/workforce_2", workforce_2_router());
	app.use("/api/donear_3", donear_3_router());

	// Ticket management (cross-system)
	app.use("/api/ticket", ticket_router());

	// 404 handler
	app.use((req: Request, res: Response) => {
		res.status(404).json({ error: "Not found" });
	});

	// Global error handler
	app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
		log("Global error handler:", err);
		res.status(500).json({
			error: err.message || "Internal server error",
		});
	});

	return app;
};
