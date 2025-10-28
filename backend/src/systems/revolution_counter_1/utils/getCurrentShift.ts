import type { Shift } from "../types";
import { getISTHourMinute } from "../../../utils/timeUtils";

export const getCurrentShift = (shifts: Shift[]): Shift | null => {
	// Get current time in IST timezone
	const { hour: currentHour, minute: currentMinute } = getISTHourMinute();

	return (
		shifts.find((shift) => {
			const shiftStartMinutes = shift.start.hour * 60 + shift.start.minute;
			const shiftEndMinutes = shift.end.hour * 60 + shift.end.minute;
			const currentMinutes = currentHour * 60 + currentMinute;

			// Handle overnight shifts (e.g., 22:00-06:00)
			if (shiftStartMinutes > shiftEndMinutes) {
				return (
					currentMinutes >= shiftStartMinutes ||
					currentMinutes <= shiftEndMinutes
				);
			}
			return (
				currentMinutes >= shiftStartMinutes && currentMinutes <= shiftEndMinutes
			);
		}) || null
	);
};
