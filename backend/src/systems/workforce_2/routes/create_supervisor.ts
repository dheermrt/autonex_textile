import { Request, Response } from "express";
import { handler } from "../../../utils/handler";
import { AuthenticatedRequest } from "../../../utils/types";
import { SUPERVISOR_2 } from "../models/SUPERVISOR_2";
import { USER } from "../../../User/USER";
import { Crypt } from "../../../modules/Crypt";
import { log } from "console";

export const create_supervisor = handler(
	async (req: AuthenticatedRequest, res: Response) => {
		try {
			const { name, email, password, ticketId } = req.body;
			const { orgId } = req.user!.workforce_2!;

			// Create user account first
			const user = await USER.create({
				name,
				email,
				hashedPassword: await Crypt.hashPassword(password),
			});

			// Create supervisor with user reference
			const supervisor = await SUPERVISOR_2.create({
				orgId,
				user: user._id,
			});

			// Update user with workforce_2 field and ticket
			await USER.findByIdAndUpdate(user._id, {
				workforce_2: {
					orgId,
					role: "supervisor",
					ticket: ticketId,
				},
			});

			// Populate user before returning
			const populatedSupervisor = await SUPERVISOR_2.findById(
				supervisor._id
			).populate("user", "name email");
			res.json(populatedSupervisor);
		} catch (error) {
			log("Error creating supervisor:", error);
			res.status(500).json({ error: "Failed to create supervisor" });
		}
	}
);
