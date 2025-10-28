import { DOWNTIME_LOG_1 } from "../models/DOWNTIME_LOG_1";
import { getISTDate, createISTDate } from "../../../utils/timeUtils";
import type { DowntimeLog, RevolutionCounter, Shift } from "../types";

export async function getShiftDowntimes(
	shift: Shift,
	counter: RevolutionCounter
): Promise<DowntimeLog[]> {
	// Get current date in IST
	const { year: todayYear, month: todayMonth, day: todayDay } = getISTDate();
	const now = new Date();
	const currentHour = now.getHours();
	const currentMinute = now.getMinutes();
	const currentTimeMinutes = currentHour * 60 + currentMinute;

	// Determine which shift period we're currently in
	let shiftStartDate = new Date(todayYear, todayMonth, todayDay);
	let shiftEndDate = new Date(todayYear, todayMonth, todayDay);
	
	// Check if we're currently in an overnight shift that started yesterday
	const isOvernightShift = shift.end.hour < shift.start.hour || 
		(shift.end.hour === shift.start.hour && shift.end.minute < shift.start.minute);
	
	if (isOvernightShift) {
		const shiftStartMinutes = shift.start.hour * 60 + shift.start.minute;
		const shiftEndMinutes = shift.end.hour * 60 + shift.end.minute;
		
		// If current time is before shift end time, we're in the shift that started yesterday
		if (currentTimeMinutes <= shiftEndMinutes) {
			const yesterday = new Date(todayYear, todayMonth, todayDay);
			yesterday.setDate(yesterday.getDate() - 1);
			shiftStartDate = yesterday;
			shiftEndDate = new Date(todayYear, todayMonth, todayDay);
		}
	}
	
	// Create shift start time
	shiftStartDate.setHours(shift.start.hour, shift.start.minute, 0, 0);
	
	// Create shift end time
	shiftEndDate.setHours(shift.end.hour, shift.end.minute, 0, 0);
	
	// Handle overnight shifts (if end hour < start hour, it's next day)
	if (isOvernightShift) {
		// Only add 1 day if we're not already in a shift that started yesterday
		if (shiftStartDate.getDate() === todayDay) {
			shiftEndDate.setDate(shiftEndDate.getDate() + 1);
		}
	}

	// Find downtimes that overlap with the current shift period
	// A downtime overlaps if: downtime.start < shift.end AND downtime.end > shift.start
	const shiftDowntimes = await DOWNTIME_LOG_1.find({
		machine: counter._id,
		$or: [
			// Downtime starts during shift
			{
				startTime: {
					$gte: shiftStartDate,
					$lt: shiftEndDate,
				},
			},
			// Downtime ends during shift
			{
				endTime: {
					$gt: shiftStartDate,
					$lte: shiftEndDate,
				},
			},
			// Downtime completely contains shift
			{
				startTime: { $lte: shiftStartDate },
				endTime: { $gte: shiftEndDate },
			},
		],
	}).sort({ startTime: -1 }); // Most recent first
	
	return shiftDowntimes;
}
