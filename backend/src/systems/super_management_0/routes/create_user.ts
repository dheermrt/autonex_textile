import { Request, Response } from "express";
import { handler } from "../../../utils/handler";
import { log } from "console";
import { USER } from "../../../User/USER";
import { Crypt } from "../../../modules/Crypt";
import { TICKET } from "../../../Ticket/TICKET";
import { SETTINGS } from "../../SETTINGS";
import { CreateUserRequest } from "../types";
import { ticketFeatures } from "../../../Ticket/ticket_io";

// each systems' organization user creation should ideally be handled in a different way, but cause 3/4 follow a similar pattern, so similar code is used for them

export const create_user = handler(async (req: Request, res: Response) => {
	try {
		const { name, email, password, systems } = req.body as CreateUserRequest;

		// Validate input
		if (!name || !email || !password) {
			res.status(400).json({
				success: false,
				error: "Name, email, and password are required",
			});
			return;
		}

		if (!systems || systems.length === 0) {
			res.status(400).json({
				success: false,
				error: "At least one system must be selected",
			});
			return;
		}

		// Check if user already exists
		const existingUser = await USER.findOne({ email });
		if (existingUser) {
			res.status(409).json({
				success: false,
				error: "User with this email already exists",
			});
			return;
		}

		// Validate systems
		const validSystems = Object.keys(SETTINGS);
		const invalidSystems = systems.filter((s) => !validSystems.includes(s));
		if (invalidSystems.length > 0) {
			res.status(400).json({
				success: false,
				error: `Invalid systems: ${invalidSystems.join(", ")}`,
			});
			return;
		}

		// Hash password
		const hashedPassword = await Crypt.hashPassword(password);
		const userData = new USER({ name, email, hashedPassword });

		// Add system access for each selected system
		for (const system of systems) {
			if (system === "super_management_0") {
				// Super management is just a boolean
				userData.super_management_0 = true;
			} else {
				// Other systems need tickets
				const systemFeatures =
					SETTINGS[system as keyof typeof SETTINGS].features;

				const ticket = await TICKET.create({
					name: `${system} Admin`,
					orgId: userData._id,
					system,
					features: [
						...systemFeatures,
						...ticketFeatures.map((feature) => feature.name),
					],
				});

				userData[system] = {
					orgId: userData._id,
					role: "admin",
					ticket: ticket._id,
				};
			}
		}

		// Create the user
		const newUser = await USER.create(userData);

		res.json({
			success: true,
			user: newUser,
		});
	} catch (error) {
		log("Error creating user:", error);
		res.status(500).json({
			success: false,
			error: "Failed to create user",
		});
	}
});
