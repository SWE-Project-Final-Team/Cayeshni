# Transaction Sequence Diagram

## Creating a Transaction

Shows the flow when a user creates an expense transaction with multiple members.

```mermaid
sequenceDiagram
    actor User as User (Payer)
    participant API as Transaction API
    participant Service as TransactionService
    participant DB as AppDbContext
    
    User->>API: POST /api/transactions
    Note over API: userId from JWT token
    activate API
    
    API->>Service: CreateTransactionAsync(userId, dto)
    activate Service
    
    Service->>DB: Verify user is in group
    DB-->>Service: ✓ Group found with user member
    
    Service->>DB: Verify all members in group
    DB-->>Service: ✓ All members exist in group
    
    Note over Service: Validate currency matches group
    Service->>Service: Assert dto.Currency == group.DefaultCurrency
    
    Note over Service: Validate member splits sum to total
    Service->>Service: Assert Sum(members.amountOwed) == totalAmount
    
    Service->>DB: Create Transaction entity
    Service->>DB: Create TransactionMember splits for each member
    DB->>DB: Save all entities
    
    DB-->>Service: Transaction persisted ✓
    Service->>Service: Map to TransactionResponseDto
    
    Service-->>API: TransactionResponseDto
    deactivate Service
    
    API-->>User: 201 Created
    deactivate API
    
    Note over User,DB: Transaction now tracks who owes what
```

## Getting Transaction with Balances

Shows how settled amounts are calculated when retrieving transaction details.

```mermaid
sequenceDiagram
    actor User
    participant API as Transaction API
    participant Service as TransactionService
    participant DB as AppDbContext
    
    User->>API: GET /api/transactions/{transactionId}
    activate API
    
    API->>Service: GetTransactionWithBalancesAsync(transactionId)
    activate Service
    
    Service->>DB: Load Transaction with Members
    DB-->>Service: Transaction entity + members
    
    Service->>DB: Query SettlementAllocations for this transaction
    DB-->>Service: List of allocations
    
    Note over Service: For each member:<br/>totalOwed = TransactionMember.amountOwed<br/>settledAmount = SUM(allocations for this member)<br/>remainingOwed = totalOwed - settledAmount
    
    Service->>Service: Calculate balances
    
    Service->>Service: Map to TransactionDetailDto with balances
    
    Service-->>API: TransactionDetailDto
    deactivate Service
    
    API-->>User: 200 OK with transaction detail
    deactivate API
```

## Getting Group Debts

Shows aggregation across all transactions to get group-wide debt overview.

```mermaid
sequenceDiagram
    actor User
    participant API as Transaction API
    participant Service as TransactionService
    participant DB as AppDbContext
    
    User->>API: GET /api/transactions/group/{groupId}/debts
    activate API
    
    API->>Service: GetGroupDebtsAsync(groupId)
    activate Service
    
    Service->>DB: Load all group members
    DB-->>Service: List of members
    
    Service->>DB: For each member: Load all transactions where member owes
    DB-->>Service: Transactions loaded
    
    Service->>DB: Load all SettlementAllocations for this group
    DB-->>Service: Allocations loaded
    
    Note over Service: For each member:<br/>totalOwed = SUM(amounts owed in all transactions)<br/>settledAmount = SUM(all allocations to this member)<br/>remainingOwed = totalOwed - settledAmount
    
    Service->>Service: Aggregate across all transactions
    
    Service->>Service: Create GroupMemberDebtDto for each member
    
    Service-->>API: List of GroupMemberDebtDto
    deactivate Service
    
    API-->>User: 200 OK with all debts
    deactivate API
    
    Note over User: User can see all outstanding balances
```
