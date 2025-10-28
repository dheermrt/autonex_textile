import cron from 'node-cron';
import { createReports as createRevolutionCounter1Reports } from '../systems/revolution_counter_1/cron/createReports';
import { ENV } from '../utils/loadEnv';

export function init_CRON_JOB() {
	if (!ENV.SERVER_TYPES.includes("cron")) return;
	console.log('🕐 Initializing cron jobs...');

	// Schedule report creation every 30 minutes (24/7)
	// This ensures reports are created promptly for any shift schedule
    const cronString = ENV.MODE === 'production' ? '*/1 * * * *' : '*/15 * * * * *';
	const reportCron = cron.schedule(cronString, async () => {
		console.log('⏰ Running scheduled report creation (every 30 minutes)...');
		try {
			await createRevolutionCounter1Reports();
		} catch (error) {
			console.error('❌ Error in scheduled report creation:', error);
		}
	}, {
		timezone: 'Asia/Kolkata' // Adjust based on your timezone
	});

	console.log('✅ Report creation cron job started:', cronString);

	// Optional: Add a daily cleanup cron job at midnight
	// const cleanupCron = cron.schedule('0 0 * * *', async () => {
	// 	console.log('🧹 Running daily cleanup...');
	// 	// You can add cleanup logic here if needed
	// 	// For example: cleanup old Redis keys, archive old reports, etc.
	// }, {
	// 	timezone: 'Asia/Kolkata'
	// });

	// console.log('✅ Daily cleanup cron job started (midnight)');

	return {
		reportCron,
		// cleanupCron,
		stopAll: () => {
			reportCron.stop();
			// cleanupCron.stop();
			console.log('🛑 All cron jobs stopped');
		}
	};
}