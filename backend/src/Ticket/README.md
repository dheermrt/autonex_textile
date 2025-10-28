# General Ticket System

This document describes the new general ticket system that replaces the system-specific `TICKET_1` model.

## Overview

The ticket system has been generalized to support multiple systems (not just `revolution_counter_1`). This allows for:

- **Scalability**: Easy addition of new systems without duplicating ticket models
- **Consistency**: Unified ticket management across all systems
- **Maintainability**: Single source of truth for ticket-related functionality

## Architecture

### Backend Structure

```
backend/src/
├── Ticket/
│   ├── TICKET.ts              # General ticket model
│   └── SystemFeatures.ts      # System-specific feature definitions
├── User/
│   └── USER.ts                # Updated to reference general TICKET
└── systems/
    └── revolution_counter_1/
        ├── routes/            # Updated to use general TICKET
        └── types.ts           # Updated Ticket interface
```

### Key Components

#### 1. General Ticket Model (`backend/src/Ticket/TICKET.ts`)

```typescript
{
  name: string;
  orgId: ObjectId;
  system: string;              // NEW: Identifies which system this ticket belongs to
  features: string[];          // System-specific features
  createdAt: Date;
  updatedAt: Date;
}
```

#### 2. System Features Definition (`backend/src/Ticket/SystemFeatures.ts`)

```typescript
export const SYSTEM_FEATURES = {
  revolution_counter_1: [
    "create_downtime_log",
    "create_needle_change_log",
    // ... other features
  ],
  system_2: [
    "create_item",
    "update_item",
    // ... other features
  ],
  // Add more systems as needed
};
```

#### 3. Feature Validation

The system automatically validates that features are valid for the specified system:

```typescript
const invalidFeatures = features.filter(
  (feature: string) => !isValidFeature("revolution_counter_1", feature)
);
```

## Migration

### Automatic Migration

Use the provided migration script to move existing `TICKET_1` data to the general system:

```typescript
import { migrateTicketsToGeneralSystem, verifyTicketMigration } from './scripts/migrateTickets';

// Run migration
await migrateTicketsToGeneralSystem();

// Verify migration
await verifyTicketMigration();
```

### Manual Steps

1. **Backup your database** before running migration
2. **Run the migration script** to move existing tickets
3. **Verify the migration** using the verification script
4. **Test the application** to ensure everything works correctly
5. **Remove old TICKET_1 collection** (optional, after verification)

## Adding New Systems

To add a new system to the ticket system:

### 1. Define System Features

Add your system to `SystemFeatures.ts`:

```typescript
export const SYSTEM_FEATURES = {
  // ... existing systems
  your_new_system: [
    "create_resource",
    "update_resource",
    "delete_resource",
    "get_resources",
  ],
};
```

### 2. Update System Enum

Add your system to the TICKET model enum:

```typescript
system: {
  type: String,
  required: true,
  enum: ["revolution_counter_1", "system_2", "system_3", "your_new_system"],
},
```

### 3. Create System Routes

Create routes similar to `revolution_counter_1` routes:

```typescript
// your_new_system/routes/create_update_ticket.ts
export async function create_update_ticket(socket: Socket) {
  handler(
    socket,
    "your_new_system/create_update_ticket",
    async (data, callback) => {
      // Validate features for your_new_system
      const invalidFeatures = features.filter(
        (feature: string) => !isValidFeature("your_new_system", feature)
      );
      
      // ... rest of implementation
    }
  );
}
```

## API Changes

### Backend Routes

All ticket-related routes now:
- Use the general `TICKET` model instead of `TICKET_1`
- Include `system: "revolution_counter_1"` in queries
- Validate features against the system-specific feature list

### Frontend

The frontend `Ticket` interface now includes a `system` field:

```typescript
export interface Ticket {
  _id: ObjectId;
  name: string;
  orgId: ObjectId;
  system: string;        // NEW
  features: string[];
  createdAt: Date;
  updatedAt: Date;
}
```

## Benefits

1. **Scalability**: Easy to add new systems without code duplication
2. **Consistency**: Unified ticket management across all systems
3. **Type Safety**: TypeScript support for system-specific features
4. **Validation**: Automatic feature validation per system
5. **Maintainability**: Single ticket model to maintain

## Backward Compatibility

- Existing `TICKET_1` data is preserved during migration
- All existing API endpoints continue to work
- No breaking changes to frontend components
- Gradual migration approach allows for testing

## Future Enhancements

- **Cross-system permissions**: Allow tickets to have features across multiple systems
- **System inheritance**: Allow systems to inherit features from other systems
- **Dynamic feature loading**: Load system features from configuration files
- **Audit logging**: Track ticket changes across systems
