const WebConnectionSession = require('../models/WebConnectionSession');
const TransactionRequest = require('../models/TransactionRequest');

/**
 * Database cleanup utilities to prevent blogging
 */

/**
 * Clean up expired connection sessions
 * This removes sessions that have expired and are older than retention period
 */
const cleanupExpiredSessions = async () => {
    try {
        const now = new Date();
        
        // Delete expired sessions older than 1 hour (give some buffer time)
        const result = await WebConnectionSession.deleteMany({
            expiresAt: { $lt: new Date(now.getTime() - 60 * 60 * 1000) },
            status: { $in: ['expired', 'rejected'] }
        });

        console.log(`Cleaned up ${result.deletedCount} expired connection sessions`);
        return result.deletedCount;
    } catch (error) {
        console.error('Error cleaning up expired sessions:', error);
        return 0;
    }
};

/**
 * Clean up expired transaction requests
 * This removes transaction requests that have expired
 */
const cleanupExpiredTransactionRequests = async () => {
    try {
        const now = new Date();
        
        // Delete expired transaction requests
        const result = await TransactionRequest.deleteMany({
            expiresAt: { $lt: now },
            status: { $in: ['pending', 'expired', 'rejected'] }
        });

        console.log(`Cleaned up ${result.deletedCount} expired transaction requests`);
        return result.deletedCount;
    } catch (error) {
        console.error('Error cleaning up expired transaction requests:', error);
        return 0;
    }
};

/**
 * Clean up old completed transaction requests (keep for 7 days)
 */
const cleanupOldTransactionRequests = async () => {
    try {
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        
        // Delete completed/submitted transaction requests older than 7 days
        const result = await TransactionRequest.deleteMany({
            createdAt: { $lt: sevenDaysAgo },
            status: { $in: ['submitted', 'completed'] }
        });

        console.log(`Cleaned up ${result.deletedCount} old transaction requests`);
        return result.deletedCount;
    } catch (error) {
        console.error('Error cleaning up old transaction requests:', error);
        return 0;
    }
};

/**
 * Clean up old approved sessions that have been inactive for more than 30 days
 */
const cleanupInactiveSessions = async () => {
    try {
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        
        // Delete approved sessions with no recent activity for 30+ days
        const result = await WebConnectionSession.deleteMany({
            status: 'approved',
            lastActivity: { $lt: thirtyDaysAgo }
        });

        console.log(`Cleaned up ${result.deletedCount} inactive connection sessions`);
        return result.deletedCount;
    } catch (error) {
        console.error('Error cleaning up inactive sessions:', error);
        return 0;
    }
};

/**
 * Run comprehensive database cleanup
 */
const runFullCleanup = async () => {
    console.log('Starting database cleanup...');
    
    const results = {
        expiredSessions: await cleanupExpiredSessions(),
        expiredTransactions: await cleanupExpiredTransactionRequests(),
        oldTransactions: await cleanupOldTransactionRequests(),
        inactiveSessions: await cleanupInactiveSessions()
    };
    
    const totalCleaned = Object.values(results).reduce((sum, count) => sum + count, 0);
    console.log(`Database cleanup completed. Total records cleaned: ${totalCleaned}`);
    
    return results;
};

/**
 * Mark expired records as expired (without deleting immediately)
 */
const markExpiredRecords = async () => {
    try {
        const now = new Date();
        
        // Mark expired sessions
        const expiredSessions = await WebConnectionSession.updateMany(
            { 
                expiresAt: { $lt: now },
                status: { $in: ['pending', 'approved'] }
            },
            { status: 'expired' }
        );

        // Mark expired transaction requests
        const expiredTransactions = await TransactionRequest.updateMany(
            { 
                expiresAt: { $lt: now },
                status: 'pending'
            },
            { status: 'expired' }
        );

        console.log(`Marked ${expiredSessions.modifiedCount} sessions and ${expiredTransactions.modifiedCount} transaction requests as expired`);
        
        return {
            sessions: expiredSessions.modifiedCount,
            transactions: expiredTransactions.modifiedCount
        };
    } catch (error) {
        console.error('Error marking expired records:', error);
        return { sessions: 0, transactions: 0 };
    }
};

module.exports = {
    cleanupExpiredSessions,
    cleanupExpiredTransactionRequests,
    cleanupOldTransactionRequests,
    cleanupInactiveSessions,
    runFullCleanup,
    markExpiredRecords
};
