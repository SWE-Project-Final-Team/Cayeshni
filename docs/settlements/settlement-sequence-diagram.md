# Settlement Sequence Diagram

## Creating a Settlement

Shows the flow when a payer creates a settlement to pay the payee.

```mermaid
sequenceDiagram
    actor Payer as Payer (Bob)
    participant API as Settlement API
    participant Service as SettlementService
    participant DB as AppDbContext
    
    Payer->>API: POST /api/settlements
    Note over API: userId = Bob from JWT token
    activate API
    
    API->>Service: CreateSettlementAsync(userId, dto)
    activate Service
    
    Note over Service: Verify payer is the request user
    Service->>Service: Assert userId == dto.PayerUserId
    
    Note over Service: Verify currency matches group
    Service->>DB: Load group
    DB-->>Service: Group entity
    Service->>Service: Assert dto.Currency == group.DefaultCurrency
    
    Note over Service: Validate allocation sum equals settlement amount
    Service->>Service: Assert SUM(allocations.amount) == dto.Amount
    
    Note over Service: For each allocation:<br/>Validate allocation ≤ remaining owed
    Service->>DB: Load transaction members for each allocation
    DB-->>Service: TransactionMember data
    
    Service->>DB: Load existing allocations to calculate remaining owed
    DB-->>Service: Existing allocations
    
    Service->>Service: For each new allocation:<br/>remainingOwed = amountOwed - SUM(existing allocations)<br/>Assert allocation.amount ≤ remainingOwed
    
    Service->>DB: Create Settlement entity
    Service->>DB: Create SettlementAllocation for each allocation
    DB->>DB: Save all entities
    
    DB-->>Service: Settlement persisted ✓
    Service->>Service: Map to SettlementResponseDto
    
    Service-->>API: SettlementResponseDto
    deactivate Service
    
    API-->>Payer: 201 Created
    deactivate API
    
    Note over Payer,DB: Settlement recorded, transaction balances updated
```

## Updating a Settlement

Shows that only the payer can update settlement notes.

```mermaid
sequenceDiagram
    actor Payer as Payer (Bob)
    participant API as Settlement API
    participant Service as SettlementService
    participant DB as AppDbContext
    
    Payer->>API: PUT /api/settlements
    activate API
    
    API->>Service: UpdateSettlementAsync(userId, settlementDto)
    activate Service
    
    Note over Service: Authorization: Only payer can update
    Service->>Service: Assert userId == settlement.PayerUserId
    
    Note over Service: Currently supports note updates only
    Service->>DB: Load settlement
    DB-->>Service: Settlement entity
    
    Service->>Service: Update settlement.note
    
    Service->>DB: Save settlement
    DB->>DB: Persist changes
    
    DB-->>Service: ✓ Updated
    Service->>Service: Map to SettlementResponseDto
    
    Service-->>API: SettlementResponseDto
    deactivate Service
    
    API-->>Payer: 200 OK
    deactivate API
```

## Deleting a Settlement

Shows authorization and cascade effects on transaction balances.

```mermaid
sequenceDiagram
    actor User
    participant API as Settlement API
    participant Service as SettlementService
    participant DB as AppDbContext
    
    User->>API: DELETE /api/settlements
    activate API
    
    API->>Service: DeleteSettlementAsync(userId, settlement)
    activate Service
    
    Note over Service: Authorization: Only payer or payee can delete
    Service->>Service: Assert userId IN (payer, payee)
    
    Service->>DB: Load settlement with allocations
    DB-->>Service: Settlement + allocations
    
    Note over Service: Deleting settlement frees up<br/>the remaining owed amounts
    Service->>DB: Delete all SettlementAllocations
    Service->>DB: Delete Settlement
    DB->>DB: Cascade delete
    
    DB-->>Service: ✓ Deleted
    
    Service-->>API: 204 No Content
    deactivate Service
    
    API-->>User: 204 No Content
    deactivate API
    
    Note over User,DB: Transaction member balances recalculated
```

## Getting Group Settlements

Shows all settlement records for a group with their allocations.

```mermaid
sequenceDiagram
    actor User
    participant API as Settlement API
    participant Service as SettlementService
    participant DB as AppDbContext
    
    User->>API: GET /api/settlements/{groupId}
    activate API
    
    API->>Service: GetGroupSettlementsAsync(groupId)
    activate Service
    
    Service->>DB: Load all settlements for group
    DB-->>Service: Settlements loaded
    
    Service->>DB: For each settlement: Load allocations
    DB-->>Service: Allocations loaded
    
    Service->>Service: Map to SettlementResponseDto list
    
    Service-->>API: List of SettlementResponseDto
    deactivate Service
    
    API-->>User: 200 OK with settlements
    deactivate API
    
    Note over User: User can see all payments made/received
```

## Settlement Impact on Transaction Balances

Shows how a settlement allocation affects the transaction's balance calculations.

```mermaid
sequenceDiagram
    participant Trans as Transaction
    participant Service as SettlementService
    participant Settle as Settlement
    
    Note over Trans,Settle: Before Settlement
    Trans->>Trans: Member owes $100<br/>settledAmount = $0<br/>remainingOwed = $100
    
    Settle->>Settle: Payment: $60 allocated to this transaction
    activate Settle
    
    Note over Settle: Create SettlementAllocation<br/>(transactionId, $60)
    
    Service->>Trans: Recalculate balance
    activate Service
    
    Service->>Service: settledAmount = SUM(allocations) = $60
    Service->>Service: remainingOwed = $100 - $60 = $40
    
    deactivate Service
    deactivate Settle
    
    Note over Trans,Settle: After Settlement
    Trans->>Trans: Member owes $100<br/>settledAmount = $60<br/>remainingOwed = $40
```
