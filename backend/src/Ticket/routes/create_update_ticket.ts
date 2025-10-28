import { Request, Response } from "express";
import { handler } from "../../utils/handler";
import { AuthenticatedRequest } from "../../utils/types";
import { TICKET } from "../TICKET";
import { log } from "console";
import { UserRepo } from "../../User/UserRepo";

export const create_update_ticket = handler(async (req: Request, res: Response) => {
	const authReq = req as AuthenticatedRequest;
	try {
		const { _id, name, system, features } = authReq.body;

		// Validate that system is provided
		if (!system) {
			res.status(400).json({ error: "System is required" });
			return;
		}

		// Check if user has access to this system
		if (!authReq.user![system as keyof typeof authReq.user]) {
			res.status(403).json({ error: "Access denied to this system" });
			return;
		}

		const systemData = authReq.user![system as keyof typeof authReq.user] as { orgId: string };
		const { orgId } = systemData;

		if (_id) {
			// Update existing ticket
			const ticket = await TICKET.findOneAndUpdate(
				{ _id, orgId, system },
				{ name, features },
				{ new: true }
			);

			if (!ticket) {
				res.status(404).json({ error: "Ticket not found or access denied" });
				return;
			}

			// Invalidate cache for all users that have this ticket in their system fields
			await UserRepo.invalidateUsersCacheByTicketId(
				ticket._id.toString(),
				system
			);

			res.json(ticket);
		} else {
			// Create new ticket
			const ticket = await TICKET.create({
				orgId,
				name,
				system,
				features,
			});
			res.json(ticket);
		}
	} catch (error) {
		log("Error creating/updating ticket:", error);
		res.status(500).json({ error: "Failed to create/update ticket" });
	}
});
