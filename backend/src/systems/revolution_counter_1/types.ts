type ObjectId = string;

export interface Reading {
	rpm: number;
	count: number;
	timestamp: number;
}

export interface Stats {
	readingCount: number;
	rpmSum: number;
	rpmAvg: number;
	startTime: number;
	endTime: number;
	idleTime: number;
	cumulativeCount: number;
	trailingWindowAvgCountPerMinute?: number;
}

export interface ConnectionState {
	connectionTimeoutSeconds: number;
	lastReadingTime: number;
	latestReading: Reading;
}

export interface State {
	stats: Stats;
	connectionState: ConnectionState;
}

//    ********************

export interface DowntimeLog {
	_id: ObjectId;
	orgId: ObjectId;
	machine: ObjectId | RevolutionCounter;
	startTime: Date;
	endTime: Date;
	reason?: string;
	createdAt: Date;
}

export interface NeedleChangeLog {
	_id: ObjectId;
	orgId: ObjectId;
	machine: ObjectId | RevolutionCounter;
	notes?: string;
	createdAt: Date;
}

export interface Operator {
	_id: ObjectId;
	orgId: ObjectId;
	user: ObjectId;
	machines: RevolutionCounter[];
	createdAt: Date;
	updatedAt: Date;
}

export interface Supervisor {
	_id: ObjectId;
	orgId: ObjectId;
	user: ObjectId;
	operators: Operator[];
	createdAt: Date;
	updatedAt: Date;
}

export interface Yarn {
	_id: ObjectId;
	orgId: ObjectId;
	quality: string;
	countsPerRoll: number;
	createdAt: Date;
}

export interface Location {
	_id: ObjectId;
	orgId: ObjectId;
	name: string;
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
export interface RevolutionCounter {
	_id: ObjectId;
	orgId: ObjectId;
	name: string;
	location: Location;
	maxRpm: number;
	setRpm: number;
	yarn: Yarn;
	shifts: {
		shift: Shift;
		operator: Operator;
		supervisor: Supervisor;
	}[];
	lastNeedleChange?: NeedleChangeLog;
	createdAt: Date;
	updatedAt: Date;
}

export interface ShiftReport {
	_id: ObjectId;
	machine: ObjectId | RevolutionCounter;
	orgId: ObjectId;
	rpmAvg: number;
	rollInfo: {
		yarn: Yarn;
		cumulativeCount: number;
		rolls: number;
	};
	shift: Shift;
	idleTime: number;
	operator: Operator;
	supervisor: Supervisor;
	downtimeLogs: (DowntimeLog | ObjectId)[];
	needleChangeLogs: (NeedleChangeLog | ObjectId)[];
	startTime: Date; // Actual start time from machine stats in Redis
	endTime: Date; // Full timestamp of shift end (when report is created)
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
	| "create_downtime_log"
	| "create_needle_change_log"
	| "create_operator"
	| "create_shift"
	| "create_supervisor"
	| "create_update_machine"
	| "create_yarn"
	| "create_location"
	| "delete_machine"
	| "get_all"
	| "get_downtime_logs"
	| "get_entities"
	| "get_machine"
	| "get_needle_change_logs"
	| "get_one"
	| "get_shift_reports"
