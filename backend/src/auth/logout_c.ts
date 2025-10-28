import { Request, Response } from "express";
import { handler } from "../utils/handler";
import { ENV } from "../utils/loadEnv";

export const logout_c = handler(async (req: Request, res: Response) => {
	// Clear the auth token cookie
	res.clearCookie("auth_token", {
		httpOnly: true,
		secure: ENV.MODE === "production",
		sameSite: ENV.MODE === "production" ? "none" : "lax",
	});

	res.json({
		message: "Logout successful",
	});
});

