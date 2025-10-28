type ObjectId = string;

// Main forecast data for a specific period
export interface Forecast {
	_id: ObjectId;
	orgId: ObjectId;
	period: Date; // Month/Year of forecast
	totalAmount: number; // Total forecast amount in Cr
	growthRate: number; // Year-over-year growth percentage
	confidence: number; // Model confidence level (0-100)
	industryAvgGrowth: number; // Industry average growth for comparison
	benchmarkConfidence: number; // Benchmark confidence level
	previousYearAmount: number; // Last year's actual for comparison
	status: "draft" | "published" | "archived";
	notes?: string;
	createdAt: Date;
	updatedAt: Date;
}

// Leading indicators that contribute to forecast
export interface Indicator {
	_id: ObjectId;
	orgId: ObjectId;
	forecast: ObjectId | Forecast;
	name: string; // e.g., "Cotton Price Impact", "Market Demand"
	category: string; // e.g., "Raw Material", "Market", "Internal"
	value: number; // Current value
	contribution: number; // Contribution to forecast (in amount or %)
	weight: number; // Weight in model (0-1)
	trend: "up" | "down" | "stable";
	color?: string; // For chart visualization
	createdAt: Date;
	updatedAt: Date;
}

// Scenario configurations for testing
export interface Scenario {
	_id: ObjectId;
	orgId: ObjectId;
	name: string;
	description?: string;
	parameters: {
		cottonPriceIndex: number; // 0-100
		marketDemandIndex: number; // 0-100
		customFactors?: Record<string, number>;
	};
	impact: {
		adjustedRevenue: number;
		revenueChange: number; // Change from base forecast
		adjustedGrowth: number;
	};
	isActive: boolean;
	createdAt: Date;
	updatedAt: Date;
}

// Historical accuracy tracking
export interface AccuracyMetric {
	_id: ObjectId;
	orgId: ObjectId;
	period: Date;
	forecastAmount: number;
	actualAmount: number;
	accuracyPercentage: number; // How accurate the forecast was
	variance: number; // Difference between forecast and actual
	variancePercentage: number;
	notes?: string;
	createdAt: Date;
}

// Monthly trend data point
export interface TrendDataPoint {
	month: string; // e.g., "Jan", "Feb"
	date: Date;
	value: number; // Forecast value
	actual?: number; // Actual value if available
	confidenceInterval: {
		low: number;
		high: number;
	};
}

// Dashboard summary data
export interface DashboardSummary {
	totalForecast: {
		amount: number;
		growthRate: number;
		growthVsLastYear: number;
	};
	growthRate: {
		value: number;
		industryAvg: number;
		difference: number;
	};
	confidence: {
		level: number;
		benchmarkDifference: number;
	};
	trendData: TrendDataPoint[];
	indicators: Indicator[];
	activeScenario?: Scenario;
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

// Real-time data types for input handling
export interface Reading {
	accuracy: number;
	timestamp: number;
}

export interface Stats {
	readingCount: number;
	accuracySum: number;
	accuracyAvg: number;
	startTime: number;
	endTime: number;
	bestAccuracy: number;
	worstAccuracy: number;
}

export interface ConnectionState {
	lastReadingTime: number;
	latestReading: Reading;
}

export interface State {
	stats: Stats;
	connectionState: ConnectionState;
}

