import { Request } from "express";

export interface AuthenticatedRequest extends Request {
	user?: {
		userId: string;
		revolution_counter_1?: {
			orgId: string;
			role: string;
			ticket: {
				features: string[];
			};
		};
		workforce_2?: {
			orgId: string;
			role: string;
			ticket: {
				features: string[];
			};
		};
		donear_3?: {
			orgId: string;
			role: string;
			ticket: {
				features: string[];
			};
		};
		super_management_0?: boolean;
	};
}

