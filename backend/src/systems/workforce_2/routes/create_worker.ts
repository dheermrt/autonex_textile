import { Request, Response } from "express";
import { handler } from "../../../utils/handler";
import { AuthenticatedRequest } from "../../../utils/types";
import { WORKER_2 } from "../models/WORKER_2";
import { USER } from "../../../User/USER";
import { Crypt } from "../../../modules/Crypt";
import { log } from "console";

export const create_worker = handler(
	async (req: AuthenticatedRequest, res: Response) => {
		try {
			const { name, email, password, ticketId, supervisorId } = req.body;
			const { orgId } = req.user!.workforce_2!;

			// Create user account first
			const user = await USER.create({
				name,
				email,
				hashedPassword: await Crypt.hashPassword(password),
			});

			// Create worker with user reference and supervisor
			const worker = await WORKER_2.create({
				orgId,
				user: user._id,
				supervisor: supervisorId, // Set supervisor relationship
			});

			// Update user with workforce_2 field and ticket
			await USER.findByIdAndUpdate(user._id, {
				workforce_2: {
					orgId,
					role: "worker",
					ticket: ticketId,
				},
			});

			// Populate user and supervisor before returning
			const populatedWorker = await WORKER_2.findById(worker._id).populate([
				"user",
				{ path: "supervisor", populate: "user" },
			]);
			res.json(populatedWorker);
		} catch (error) {
			log("Error creating worker:", error);
			res.status(500).json({ error: "Failed to create worker" });
		}
	}
);
