import { USER } from "./USER";
import { Crypt } from "../modules/Crypt";
import mongoose from "mongoose";
import { log } from "console";
import { redis } from "../index";
import { SETTINGS } from "../systems/SETTINGS";

/**
 * UserRepo - User Repository with Redis Caching
 *
 * This module provides user management functionality with Redis caching optimization.
 *
 * Caching Strategy:
 * - getUserById: Caches user data for 24 hours (86400 seconds)
 * - Cache invalidation: Automatically invalidates cache when user data is modified
 * - Cache key format: "{userId}:user" (follows system pattern)
 *
 * Performance Benefits:
 * - Reduces database queries for frequently accessed users
 * - Improves response times for user authentication and data retrieval
 * - Automatic cache invalidation ensures data consistency
 *
 * Usage:
 * - getUserById: Automatically handles cache hit/miss
 * - invalidateUserCache: Manually clear cache for a user
 * - refreshUserCache: Force refresh cache with fresh data
 */

// Function to delete all documents with a specific userId from all collections
async function deleteAllUserDocuments(userId: string) {
	if (!mongoose.connection.db)
		throw new Error("Mongoose connection not established");

	const collections = await mongoose.connection.db.listCollections().toArray();
	const collectionNames = collections.map((col) => col.name);

	const deletionResults = [];

	// Search through all collections for documents with matching userId
	for (const collectionName of collectionNames) {
		try {
			const model = mongoose.model(collectionName);

			// Check if the model has a userId field by looking at its schema
			const schema = model.schema;
			const hasUserIdField = schema.paths.userId || schema.paths.user_id;

			if (hasUserIdField) {
				const result = await model.deleteMany({ userId });
				if (result.deletedCount > 0) {
					deletionResults.push({
						collection: collectionName,
						deletedCount: result.deletedCount,
					});
				}
			}
		} catch (error) {
			// Skip collections that don't have a model or have errors
			continue;
		}
	}

	return deletionResults;
}

export const UserRepo = {
	createUser: async (
		name: string,
		email: string,
		password: string,
		{ customId }: { customId?: string } = {}
	) => {
		if (!password || password.length < 6) {
			throw new Error("Password of length 6 is required");
		}

		// Prepare data object
		const userData = {
			_id: customId,
			email,
			name,
			hashedPassword: await Crypt.hashPassword(password),
		};

		const newUser = await USER.create(userData);
		return {
			_id: newUser._id,
			name: newUser.name,
			email: newUser.email,
		};
	},
	getUserById: async (id: string) => {
		// Check cache first - following system pattern: userId:system_name
		const cacheKey = `${id}:user`;
		const cachedUser = await redis.get(cacheKey);

		if (cachedUser) {
			log(`Cache hit for user: ${id}`);
			return JSON.parse(cachedUser);
		}

		// Cache miss - fetch from database
		log(`Cache miss for user: ${id}`);
		const user = await USER.findById(id)
			.select("-hashedPassword")
			.populate(Object.keys(SETTINGS).map((system) => `${system}.ticket`));

		if (user) {
			// Cache the user data for 24 hours (86400 seconds)
			await redis.setex(cacheKey, 86400, JSON.stringify(user));
			log(`Cached user: ${id}`);
		}

		return user;
	},
	getUserByEmail: async (email: string) => {
		const user = await USER.findOne({ email });
		return user;
	},

	// Method to add system to user
	addSystemToUser: async (
		userId: string,
		systemId: string,
		configName: string
	) => {
		log("ADD SYSTEM TO USER", { userId, systemId, configName });
		const user = await USER.findByIdAndUpdate(
			userId,
			{
				$addToSet: {
					systems: { configName, _id: systemId },
				},
			},
			{ new: true }
		);

		// Invalidate user cache after system addition
		if (user) {
			await redis.del(`${userId}:user`);
			log(`Invalidated cache for user: ${userId}`);
		}

		return user;
	},

	// Method to remove system from user
	removeSystemFromUser: async (userId: string, systemId: string) => {
		log("REMOVE SYSTEM FROM USER", { userId, systemId });
		const user = await USER.findByIdAndUpdate(
			userId,
			{ $pull: { systems: { _id: systemId } } },
			{ new: true }
		);
		log("USER AFTER REMOVAL:", user?.systems);

		// Invalidate user cache after system removal
		if (user) {
			await redis.del(`${userId}:user`);
			log(`Invalidated cache for user: ${userId}`);
		}

		return user;
	},

	// Method to delete user and all associated documents
	deleteUser: async (userId: string) => {
		// First delete all documents that reference this user
		const deletionResults = await deleteAllUserDocuments(userId);

		// Then delete the user itself
		const deletedUser = await USER.findByIdAndDelete(userId);

		// Invalidate user cache after deletion
		if (deletedUser) {
			await redis.del(`${userId}:user`);
			log(`Invalidated cache for deleted user: ${userId}`);
		}

		return {
			deletedUser,
			deletedDocuments: deletionResults,
		};
	},

	// Utility method to invalidate user cache
	invalidateUserCache: async (userId: string) => {
		await redis.del(`${userId}:user`);
		log(`Manually invalidated cache for user: ${userId}`);
	},

	invalidateUsersCache: async (userIds: string[]) => {
		for (const userId of userIds) {
			UserRepo.invalidateUserCache(userId);
		}
		log(`Invalidated cache for users: ${userIds.join(", ")}`);
	},

	// Method to find users by ticket ID and invalidate their cache
	invalidateUsersCacheByTicketId: async (ticketId: string, system: string) => {
		try {
			// Find all users that have this ticket ID in the specific system field
			const users = await USER.find({
				[`${system}.ticket`]: ticketId,
			}).select("_id");

			const userIds = users.map((user) => user._id.toString());

			if (userIds.length > 0) {
				await UserRepo.invalidateUsersCache(userIds);
				log(
					`Invalidated cache for ${userIds.length} users with ticket: ${ticketId} in system: ${system}`
				);
			} else {
				log(
					`No users found with ticket: ${ticketId} in system: ${system} to invalidate cache`
				);
			}

			return userIds;
		} catch (error) {
			log(`Error invalidating users cache by ticket ID: ${error}`);
			return [];
		}
	},

	// Utility method to refresh user cache
	refreshUserCache: async (userId: string) => {
		// First invalidate existing cache
		await redis.del(`${userId}:user`);

		// Then fetch fresh data and cache it
		const user = await USER.findById(userId)
			.select("-hashedPassword")
			.populate(Object.keys(SETTINGS).map((system) => `${system}.ticket`));

		if (user) {
			const cacheKey = `${userId}:user`;
			await redis.setex(cacheKey, 86400, JSON.stringify(user));
			log(`Refreshed cache for user: ${userId}`);
		}

		return user;
	},
};
