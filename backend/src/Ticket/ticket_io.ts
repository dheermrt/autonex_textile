import { Router, Request, Response, NextFunction } from "express";
import { create_update_ticket } from "./routes/create_update_ticket";
import { get_tickets } from "./routes/get_tickets";
import { log } from "console";
import { SETTINGS } from "../systems/SETTINGS";
import { AuthenticatedRequest } from "../utils/types";

export const ticketFeatures = [create_update_ticket, get_tickets] as const;

// Middleware to check if user has access to ticket features from any system
const checkTicketFeatureAccess = (featureName: string) => {
	return (req: Request, res: Response, next: NextFunction) => {
		const authReq = req as AuthenticatedRequest;
		
		// Check if user has this feature in any of their systems
		let hasFeature = false;
		
		Object.keys(SETTINGS).forEach((system) => {
			const systemData = authReq.user![system as keyof typeof authReq.user];
			if (systemData && typeof systemData === 'object' && 'ticket' in systemData) {
				const ticket = (systemData as { ticket: { features: string[] } }).ticket;
				if (ticket.features.includes(featureName)) {
					hasFeature = true;
				}
			}
		});

		if (!hasFeature) {
			return res.status(403).json({ error: `Feature ${featureName} not accessible` });
		}

		next();
	};
};

export const ticket_router = () => {
	const router = Router();

	// Register routes with feature access checks
	router.post("/create_update_ticket", checkTicketFeatureAccess("create_update_ticket"), create_update_ticket);
	router.get("/get_tickets", checkTicketFeatureAccess("get_tickets"), get_tickets);

	return router;
};
