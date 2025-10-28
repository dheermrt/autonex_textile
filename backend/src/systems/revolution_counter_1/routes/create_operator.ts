import { Request, Response } from "express";
import { handler } from "../../../utils/handler";
import { AuthenticatedRequest } from "../../../utils/types";
import { OPERATOR_1 } from "../models/OPERATOR_1";
import { USER } from "../../../User/USER";
import { Crypt } from "../../../modules/Crypt";
import { log } from "console";

export const create_operator = handler(
	async (req: AuthenticatedRequest, res: Response) => {
		try {
			const { name, email, password, ticketId, supervisorId } = req.body;
			const { orgId } = req.user!.revolution_counter_1!;

			// Create user account first
			const user = await USER.create({
				name,
				email,
				hashedPassword: await Crypt.hashPassword(password),
			});

			// Create operator with user reference and supervisor
			const operator = await OPERATOR_1.create({
				orgId,
				user: user._id,
				supervisor: supervisorId, // Set supervisor relationship
			});

			// Update user with revolution_counter_1 field and ticket
			await USER.findByIdAndUpdate(user._id, {
				revolution_counter_1: {
					orgId,
					role: "operator",
					ticket: ticketId,
				},
			});

			// Populate user before returning
			const populatedOperator = await OPERATOR_1.findById(
				operator._id
			).populate("user", "name email");
			res.json(populatedOperator);
		} catch (error) {
			log("Error creating operator:", error);
			res.status(500).json({ error: "Failed to create operator" });
		}
	}
);
