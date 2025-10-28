type ObjectId = string;

export interface Reading {
	rcpm: number; // Rolls cleaned per minute
	count: number; // Number of rolls cleaned
	in: number; // Total rolls that came to the table
	timestamp: number;
}

export interface ConnectionState {
	lastReadingTime: number;
	latestReading: Reading;
}

export interface Stats {
	readingCount: number;
	rcpmSum: number;
	rcpmAvg: number;
	startTime: number;
	endTime: number;
	cumulativeCount: number;
	cumulativeIn: number;
}

export interface State {
	stats: Stats;
	connectionState: ConnectionState;
}

//    ********************

export interface Worker {
	_id: ObjectId;
	orgId: ObjectId;
	user: ObjectId;
	supervisor?: Supervisor;
	createdAt: Date;
	updatedAt: Date;
}

export interface Supervisor {
	_id: ObjectId;
	orgId: ObjectId;
	user: ObjectId;
	createdAt: Date;
	updatedAt: Date;
}

export interface Area {
	_id: ObjectId;
	orgId: ObjectId;
	name: string;
	maxRcpm: number;
	setRcpm: number;
	shifts: {
		shift: Shift;
		worker: Worker;
		supervisor: Supervisor;
	}[];
	createdAt: Date;
	updatedAt: Date;
}

export interface Shift {
	_id: ObjectId;
	name: string;
	orgId: ObjectId;
	start: { hour: number; minute: number };
	end: { hour: number; minute: number };
}

export interface ShiftReport {
	_id: ObjectId;
	area: ObjectId | Area;
	orgId: ObjectId;
	rcpmAvg: number;
	rollInfo: {
		in: number; // Total rolls that came to the table
		count: number; // Number of rolls cleaned out of in
	};
	shift: Shift;
	worker: Worker;
	supervisor: Supervisor;
	startTime: Date;
	endTime: Date;
	createdAt: Date;
}

export interface Ticket {
	_id: ObjectId;
	name: string;
	orgId: ObjectId;
	system: string;
	features: string[];
	createdAt: Date;
	updatedAt: Date;
}

export type Feature =
	| "create_worker"
	| "create_shift"
	| "create_supervisor"
	| "create_update_area"
	| "delete_area"
	| "get_all"
	| "get_entities"
	| "get_area"
	| "get_one"
	| "get_shift_reports"
	| "create_update_ticket"
	| "get_tickets";
