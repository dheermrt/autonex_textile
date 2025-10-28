// Types for super management system

export interface SystemAccessInfo {
	orgId: string;
	role: string;
	ticket: string;
}

export interface UserWithSystemAccess {
	_id: string;
	name: string;
	email: string;
	revolution_counter_1?: SystemAccessInfo;
	workforce_2?: SystemAccessInfo;
	donear_3?: SystemAccessInfo;
	super_management_0?: boolean;
	createdAt: Date | string;
	updatedAt: Date | string;
}

export interface CreateUserRequest {
	name: string;
	email: string;
	password: string;
	systems: string[]; // Array of system names to grant admin access to
}

export interface GetUsersResponse {
	success: boolean;
	users: UserWithSystemAccess[];
	error?: string;
}

export interface CreateUserResponse {
	success: boolean;
	user?: UserWithSystemAccess;
	error?: string;
}
