import { Request, Response, NextFunction } from "express";
import { Jwt } from "../modules/Jwt";
import { log } from "console";
import { AuthenticatedRequest } from "../utils/types";
import { USER } from "../User/USER";
import { UserRepo } from "../User/UserRepo";

/**
 * Authentication middleware for Express
 * Validates JWT token and attaches user data to request
 */
export const auth_wall = async (
	req: AuthenticatedRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		// Get token from cookie or Authorization header
		const token =
			req.cookies?.auth_token ||
			req.headers.authorization?.replace("Bearer ", "");

		log("token length: ", token?.length);

		if (!token) {
			return res.status(401).json({ error: "Authentication required" });
		}

		// Verify JWT token
		const decoded = Jwt.verifyToken<{ userId: string }>(token);

		if (!decoded || !decoded.userId) {
			return res.status(401).json({ error: "Invalid token" });
		}

		// Fetch user data from database
		const user = await UserRepo.getUserById(decoded.userId);
		if (!user) return res.status(401).json({ error: "User not found" });
		req.user = user;
		next();
	} catch (error) {
		log("Auth wall error:", error);
		res.status(401).json({ error: "Authentication failed" });
	}
};
