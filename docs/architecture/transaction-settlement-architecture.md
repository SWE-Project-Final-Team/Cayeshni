# Transactions & Settlements Architecture

## System Architecture

```mermaid
graph TB
    Client["Client<br/>(Frontend/API Consumer)"]
    
    subgraph API["API Layer"]
        TransController["TransactionController"]
        SettleController["SettlementController"]
    end
    
    subgraph Service["Service Layer<br/>(Business Logic)"]
        TransService["TransactionService"]
        SettleService["SettlementService"]
    end
    
    subgraph Domain["Domain Layer<br/>(Entities)"]
        Trans["Transaction Entity"]
        TransMem["TransactionMember"]
        Settle["Settlement Entity"]
        SettleAlloc["SettlementAllocation"]
        Group["Group Entity"]
    end
    
    subgraph Data["Data Access Layer<br/>(EF Core)"]
        Context["AppDbContext"]
        DB[(PostgreSQL)]
    end
    
    Client -->|HTTP| API
    
    TransController -->|calls| TransService
    SettleController -->|calls| SettleService
    
    TransService -->|validates & creates| Trans
    TransService -->|loads| TransMem
    TransService -->|queries| SettleAlloc
    
    SettleService -->|creates| Settle
    SettleService -->|creates| SettleAlloc
    SettleService -->|validates| Trans
    SettleService -->|loads| Group
    
    Trans -->|belongs to| Group
    TransMem -->|references| Trans
    Settle -->|belongs to| Group
    SettleAlloc -->|references| Settle
    SettleAlloc -->|references| Trans
    
    Context -->|manages| Trans
    Context -->|manages| TransMem
    Context -->|manages| Settle
    Context -->|manages| SettleAlloc
    Context -->|queries| DB
```

## Data Flow: Creating Settlement

```mermaid
sequenceDiagram
    Client->>SettleController: POST /api/settlements<br/>CreateSettlementDto
    SettleController->>SettleService: CreateSettlementAsync(userId, dto)
    
    SettleService->>SettleService: Validate payer authorization
    SettleService->>Context: Load group
    SettleService->>SettleService: Validate currency
    SettleService->>SettleService: Validate allocation sum
    
    loop For each allocation
        SettleService->>Context: Load transaction & members
        SettleService->>Context: Query existing allocations
        SettleService->>SettleService: Calculate remaining owed
        SettleService->>SettleService: Validate allocation ≤ remaining
    end
    
    SettleService->>Context: Create Settlement entity
    SettleService->>Context: Create SettlementAllocations
    Context->>DB: INSERT Settlement
    Context->>DB: INSERT SettlementAllocations
    
    SettleService->>SettleService: Map to SettlementResponseDto
    SettleService-->>SettleController: SettlementResponseDto
    SettleController-->>Client: 201 Created
```

## Data Flow: Calculating Transaction Balance

```mermaid
graph TD
    A["GetTransactionWithBalancesAsync<br/>(transactionId)"]
    
    A --> B["Load Transaction<br/>from database"]
    B --> C["Load TransactionMembers<br/>for this transaction"]
    C --> D["Query SettlementAllocations<br/>for this transaction"]
    
    D --> E{"For each<br/>TransactionMember"}
    
    E --> F["Get amountOwed<br/>from TransactionMember"]
    F --> G["SUM all SettlementAllocations<br/>for this member"]
    G --> H["Calculate:<br/>settledAmount = SUM(allocations)"]
    H --> I["Calculate:<br/>remainingOwed = amountOwed - settledAmount"]
    
    I --> J["Create TransactionMemberBalanceDto<br/>with all 3 values"]
    J --> E
    
    E --> K["Create TransactionDetailDto<br/>with all member balances"]
    K --> L["Return to API controller"]
    
    style F fill:#cce5ff
    style G fill:#cce5ff
    style H fill:#fff3cd
    style I fill:#fff3cd
    style J fill:#d4edda
```

## Relationship Diagram

```mermaid
erDiagram
    GROUP ||--o{ TRANSACTION : "1:many"
    GROUP ||--o{ SETTLEMENT : "1:many"
    
    TRANSACTION ||--o{ TRANSACTION_MEMBER : "1:many"
    TRANSACTION ||--o{ SETTLEMENT_ALLOCATION : "1:many"
    
    SETTLEMENT ||--o{ SETTLEMENT_ALLOCATION : "1:many"
    
    SETTLEMENT_ALLOCATION }o--|| TRANSACTION : "references"
    
    GROUP {
        uuid id PK
        string name
        currency default_currency
    }
    
    TRANSACTION {
        uuid id PK
        uuid group_id FK
        uuid paid_by_user_id
        decimal total_amount
        currency currency
        string category
        string description
        datetime created_at
    }
    
    TRANSACTION_MEMBER {
        uuid transaction_id FK "PK"
        uuid user_id FK "PK"
        decimal amount_owed
    }
    
    SETTLEMENT {
        uuid id PK
        uuid group_id FK
        uuid payer_user_id
        uuid payee_user_id
        decimal amount
        currency currency
        string note
        datetime created_at
    }
    
    SETTLEMENT_ALLOCATION {
        uuid settlement_id FK "PK"
        uuid transaction_id FK "PK"
        uuid debtor_user_id
        decimal allocated_amount
    }
```

## Balance Calculation Formula

```mermaid
graph TB
    A["Transaction Member Balance<br/>Calculation"]
    
    A --> B["totalOwed =<br/>TransactionMember.amountOwed"]
    
    A --> C["settledAmount =<br/>SUM(SettlementAllocations<br/>WHERE<br/>transactionId = this transaction<br/>AND debtorUserId = this member)"]
    
    A --> D["remainingOwed =<br/>totalOwed - settledAmount"]
    
    B --> E{"Example:<br/>Transaction: $100<br/>Bob owes full amount"}
    C --> E
    D --> E
    
    E --> F["Before settlement:<br/>totalOwed = $100<br/>settledAmount = $0<br/>remainingOwed = $100"]
    
    F --> G["Settlement: $60 allocated to Bob"]
    
    G --> H["After settlement:<br/>totalOwed = $100<br/>settledAmount = $60<br/>remainingOwed = $40"]
    
    style B fill:#cce5ff
    style C fill:#cce5ff
    style D fill:#fff3cd
    style F fill:#d4edda
    style H fill:#d4edda
```

## Group Debt Aggregation Formula

```mermaid
graph TB
    A["Group Debt Aggregation<br/>GetGroupDebtsAsync"]
    
    A --> B["For each group member"]
    
    B --> C["totalOwed =<br/>SUM(TransactionMember.amountOwed<br/>WHERE userId = this member)"]
    
    B --> D["settledAmount =<br/>SUM(SettlementAllocations<br/>WHERE debtorUserId = this member)"]
    
    B --> E["remainingOwed =<br/>totalOwed - settledAmount"]
    
    C --> F{"Example: Bob<br/>owes in 2 transactions"}
    D --> F
    E --> F
    
    F --> G["Trans 1: $100<br/>Trans 2: $60<br/>totalOwed = $160"]
    
    G --> H["Settled 1: $100<br/>Settled 2: $60<br/>settledAmount = $160"]
    
    H --> I["remainingOwed = $160 - $160 = $0 ✓<br/>Bob has fully settled"]
    
    style C fill:#cce5ff
    style D fill:#cce5ff
    style E fill:#fff3cd
    style G fill:#d4edda
    style I fill:#d4edda
```
