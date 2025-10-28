import { Request, Response } from "express";
import { handler } from "../../../utils/handler";
import { AuthenticatedRequest } from "../../../utils/types";
import { DOWNTIME_LOG_1 } from "../models/DOWNTIME_LOG_1";
import { REVOLUTION_COUNTER_1 } from "../models/REVOLUTION_COUNTER_1";
import { MachineService } from "../services/MachineService";
import { log } from "console";

export const get_downtime_logs = handler(
	async (req: AuthenticatedRequest, res: Response) => {
		try {
			const {
				page = 1,
				limit = 10,
				search = "",
				machineId,
			} = req.query as Record<string, string>;
			const pageNum = Number(page);
			const limitNum = Number(limit);
			const { orgId, role } = req.user!.revolution_counter_1!;
			const skip = (pageNum - 1) * limitNum;

			// Get accessible machine IDs using the service
			const accessibleMachineIds = await MachineService.getMachineIds(
				req.user!.userId,
				orgId,
				role
			);

			// If no accessible machines, return empty result
			if (accessibleMachineIds.length === 0) {
				res.json({
					logs: [],
					totalPages: 0,
					currentPage: pageNum,
					totalCount: 0,
				});
				return;
			}

			// Build query with orgId filter and accessible machines
			let query: Record<string, unknown> = {
				orgId: orgId,
				machine: { $in: accessibleMachineIds },
			};

			// If machineId is provided, validate access and filter by specific machine
			if (machineId) {
				// Validate machine access using MachineService
				const machine = await MachineService.getMachine(
					req.user!.userId,
					orgId,
					role,
					machineId
				);

				if (!machine) {
					throw new Error("Machine not found or unauthorized access");
				}
				query.machine = machineId;
			}

			if (search) {
				if (machineId) {
					// If machineId is provided, only search in reason field
					query.reason = { $regex: search, $options: "i" };
				} else {
					// If searching across all accessible machines, first find machines that match the search criteria
					const matchingMachines = await REVOLUTION_COUNTER_1.find({
						_id: { $in: accessibleMachineIds },
						$or: [
							{ name: { $regex: search, $options: "i" } },
							{ location: { $regex: search, $options: "i" } },
						],
					}).select("_id");

					const matchingMachineIds = matchingMachines.map((m) => m._id);

					// Build query for downtime logs
					query = {
						orgId: orgId,
						$or: [
							{ reason: { $regex: search, $options: "i" } },
							{ machine: { $in: matchingMachineIds } },
						],
					};
				}
			}

			// Get total count for pagination
			const totalCount = await DOWNTIME_LOG_1.countDocuments(query);

			// Get logs with pagination and populate machine details
			const logs = await DOWNTIME_LOG_1.find(query)
				.populate("machine", "name location")
				.sort({ createdAt: -1 })
				.skip(skip)
				.limit(limitNum);

			const totalPages = Math.ceil(totalCount / limitNum);

			log(`Found ${logs.length} downtime logs for page ${pageNum}`);

			res.json({
				logs,
				totalPages,
				currentPage: pageNum,
				totalCount,
			});
		} catch (error) {
			log("Error fetching downtime logs:", error);
			res.status(500).json({
				error: "Failed to fetch downtime logs",
				logs: [],
				totalPages: 0,
				currentPage: 1,
				totalCount: 0,
			});
		}
	}
);
