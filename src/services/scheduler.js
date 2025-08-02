const cron = require('node-cron');
const Logger = require('../utils/logger');

class JobScheduler {
    constructor() {
        this.jobs = new Map();
        this.isInitialized = false;
    }

    async initialize() {
        this.isInitialized = true;
        this.setupDefaultJobs();
        Logger.info('Job scheduler initialized');
    }

    setupDefaultJobs() {
        // Cleanup old notifications every day at midnight
        this.scheduleJob('cleanup-notifications', '0 0 * * *', () => {
            Logger.info('Running scheduled notification cleanup');
            // Implementation would be here
        });

        // Generate analytics reports every hour
        this.scheduleJob('analytics-report', '0 * * * *', () => {
            Logger.info('Generating hourly analytics report');
            // Implementation would be here
        });

        // Health check every 5 minutes
        this.scheduleJob('health-check', '*/5 * * * *', () => {
            Logger.debug('Running scheduled health check');
            // Implementation would be here
        });
    }

    scheduleJob(name, schedule, task) {
        if (this.jobs.has(name)) {
            this.jobs.get(name).destroy();
        }

        const job = cron.schedule(schedule, task, {
            scheduled: false
        });

        this.jobs.set(name, job);
        job.start();

        Logger.info(`Scheduled job '${name}' with schedule '${schedule}'`);
        return job;
    }

    stopJob(name) {
        if (this.jobs.has(name)) {
            this.jobs.get(name).stop();
            Logger.info(`Stopped job '${name}'`);
            return true;
        }
        return false;
    }

    startJob(name) {
        if (this.jobs.has(name)) {
            this.jobs.get(name).start();
            Logger.info(`Started job '${name}'`);
            return true;
        }
        return false;
    }

    removeJob(name) {
        if (this.jobs.has(name)) {
            this.jobs.get(name).destroy();
            this.jobs.delete(name);
            Logger.info(`Removed job '${name}'`);
            return true;
        }
        return false;
    }

    getJobs() {
        return Array.from(this.jobs.keys());
    }

    shutdown() {
        Logger.info('Shutting down job scheduler...');
        for (const [name, job] of this.jobs) {
            job.destroy();
            Logger.info(`Destroyed job '${name}'`);
        }
        this.jobs.clear();
    }
}

module.exports = new JobScheduler();
