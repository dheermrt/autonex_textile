import { Request, Response } from "express";
import { handler } from "../../../utils/handler";
import { log } from "console";
import { USER } from "../../../User/USER";
import { UserWithSystemAccess } from "../types";

export const get_users = handler(async (_: Request, res: Response) => {
	try {
		// Get all users from the database
		const users = await USER.find({}).select("-hashedPassword").lean();

		// Transform to user format with full system info
		const usersWithAccess: UserWithSystemAccess[] = users.map(
			(user: Record<string, unknown>) => {
				const userObj: UserWithSystemAccess = {
					_id: String(user._id),
					name: String(user.name),
					email: String(user.email),
					createdAt: user.createdAt as Date,
					updatedAt: user.updatedAt as Date,
				};

				// Add system access info
				if (user.revolution_counter_1) {
					const sys = user.revolution_counter_1 as Record<string, unknown>;
					userObj.revolution_counter_1 = {
						orgId: String(sys.orgId),
						role: String(sys.role),
						ticket: String(sys.ticket),
					};
				}

				if (user.workforce_2) {
					const sys = user.workforce_2 as Record<string, unknown>;
					userObj.workforce_2 = {
						orgId: String(sys.orgId),
						role: String(sys.role),
						ticket: String(sys.ticket),
					};
				}

				if (user.donear_3) {
					const sys = user.donear_3 as Record<string, unknown>;
					userObj.donear_3 = {
						orgId: String(sys.orgId),
						role: String(sys.role),
						ticket: String(sys.ticket),
					};
				}

				if (user.super_management_0) {
					userObj.super_management_0 = Boolean(user.super_management_0);
				}

				return userObj;
			}
		);

		// Sort by creation date (newest first)
		usersWithAccess.sort(
			(a, b) =>
				new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
		);

		res.json({
			success: true,
			users: usersWithAccess,
		});
	} catch (error) {
		log("Error getting users:", error);
		res.status(500).json({
			success: false,
			users: [],
			error: "Failed to get users",
		});
	}
});
