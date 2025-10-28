import {
	featureRoutes as revolution_counter_1_features,
} from "./revolution_counter_1/revolution_counter_1_io";
import {
	featureRoutes as workforce_2_features,
} from "./workforce_2/workforce_2_io";
import {
	featureRoutes as donear_3_features,	
} from "./donear_3/donear_3_io";

export const SETTINGS = {
	super_management_0: {
		features: [],
	},
	revolution_counter_1: {
		features: Object.keys(revolution_counter_1_features),
	},
	workforce_2: {
		features: Object.keys(workforce_2_features),
	},
	donear_3: {
		features: Object.keys(donear_3_features),
	},
};

// used as Object.keys(SETTINGS) in ticket_io.ts, TICKET.ts, UserRepo.ts
// So just adding the system here will auto adjust it mostly everywhere
// Just have to be careful if the new system causes difference

// !!!!!!!!!!!!!!!!! IMPORTANT !!!!!!!!!!!!!!!!!
// Will have to manually add in the USER.ts and Db.ts files
