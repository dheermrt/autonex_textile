import { Request, Response } from "express";
import { handler } from "../../utils/handler";
import { AuthenticatedRequest } from "../../utils/types";
import { TICKET } from "../TICKET";
import { log } from "console";

export const get_tickets = handler(async (req: Request, res: Response) => {
	const authReq = req as AuthenticatedRequest;
	try {
		const { system } = authReq.query as { system: string };
		
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

		// Build query
		const query: Record<string, unknown> = { orgId };
		if (system) {
			query.system = system;
		}

		const tickets = await TICKET.find(query);
		res.json(tickets);
	} catch (error) {
		log("Error fetching tickets:", error);
		res.status(500).json({ error: "Failed to fetch tickets" });
	}
});
