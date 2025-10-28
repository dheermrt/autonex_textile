import { Request, Response } from "express";
import { handler } from "../../../utils/handler";
import { AuthenticatedRequest } from "../../../utils/types";
import { SUPERVISOR_1 } from "../models/SUPERVISOR_1";
import { USER } from "../../../User/USER";
import { Crypt } from "../../../modules/Crypt";
import { log } from "console";

export const create_supervisor = handler(
	async (req: AuthenticatedRequest, res: Response) => {
		try {
			const { name, email, password, ticketId } = req.body;
			const { orgId } = req.user!.revolution_counter_1!;

			// Create user account first
			const user = await USER.create({
				name,
				email,
				hashedPassword: await Crypt.hashPassword(password),
			});

			// Create supervisor with user reference
			const supervisor = await SUPERVISOR_1.create({
				orgId,
				user: user._id,
			});

			// Update user with revolution_counter_1 field and ticket
			await USER.findByIdAndUpdate(user._id, {
				revolution_counter_1: {
					orgId,
					role: "supervisor",
					ticket: ticketId,
				},
			});

			// Populate user before returning
			const populatedSupervisor = await SUPERVISOR_1.findById(
				supervisor._id
			).populate("user", "name email");
			res.json(populatedSupervisor);
		} catch (error) {
			log("Error creating supervisor:", error);
			res.status(500).json({ error: "Failed to create supervisor" });
		}
	}
);
