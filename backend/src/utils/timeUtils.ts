/**
 * Centralized Time Utilities for IST (Indian Standard Time)
 * 
 * These utilities ensure all time operations happen in IST timezone
 * regardless of server timezone, providing predictable behavior.
 * 
 * IST = UTC + 5:30 (Asia/Kolkata)
 */

/**
 * Get current time components in IST timezone
 * @param date - Optional date to convert (defaults to current time)
 * @returns Object with IST time components
 */
export function getISTTime(date: Date = new Date()): {
	hour: number;
	minute: number;
	second: number;
	day: number;
	month: number;
	year: number;
	dateObject: Date;
} {
	// Convert to IST using toLocaleString with Asia/Kolkata timezone
	const istString = date.toLocaleString('en-US', {
		timeZone: 'Asia/Kolkata',
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
		hour: '2-digit',
		minute: '2-digit',
		second: '2-digit',
		hour12: false
	});
	
	// Parse the IST string (format: "MM/DD/YYYY, HH:mm:ss")
	const [datePart, timePart] = istString.split(', ');
	const [month, day, year] = datePart.split('/').map(Number);
	const [hour, minute, second] = timePart.split(':').map(Number);
	
	// Create a Date object representing this exact moment in IST
	// by converting IST time back to UTC for storage
	const istDate = new Date(Date.UTC(year, month - 1, day, hour - 5, minute - 30, second));
	
	return {
		hour,
		minute,
		second,
		day,
		month: month - 1, // JavaScript months are 0-indexed
		year,
		dateObject: istDate
	};
}

/**
 * Create a Date object for a specific time in IST
 * @param year - Year in IST
 * @param month - Month in IST (0-indexed, like JavaScript Date)
 * @param day - Day in IST
 * @param hour - Hour in IST (0-23)
 * @param minute - Minute in IST (0-59)
 * @param second - Second in IST (0-59, default 0)
 * @returns Date object representing the IST time
 */
export function createISTDate(
	year: number,
	month: number,
	day: number,
	hour: number,
	minute: number,
	second: number = 0
): Date {
	// IST is UTC+5:30, so we subtract 5 hours and 30 minutes from IST time to get UTC
	return new Date(Date.UTC(year, month, day, hour - 5, minute - 30, second, 0));
}

/**
 * Get current hour and minute in IST
 * Convenience function for shift detection
 * @returns Object with hour and minute in IST
 */
export function getISTHourMinute(): { hour: number; minute: number } {
	const istTime = getISTTime();
	return { hour: istTime.hour, minute: istTime.minute };
}

/**
 * Get current date components in IST (without time)
 * @returns Object with year, month, day in IST
 */
export function getISTDate(): { year: number; month: number; day: number } {
	const istTime = getISTTime();
	return { year: istTime.year, month: istTime.month, day: istTime.day };
}

/**
 * Format a date to IST string for logging
 * @param date - Date to format
 * @returns Formatted string like "09 Oct 2025, 13:30:45 IST"
 */
export function formatISTLog(date: Date = new Date()): string {
	const ist = getISTTime(date);
	const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
	return `${ist.day.toString().padStart(2, '0')} ${monthNames[ist.month]} ${ist.year}, ${ist.hour.toString().padStart(2, '0')}:${ist.minute.toString().padStart(2, '0')}:${ist.second.toString().padStart(2, '0')} IST`;
}

