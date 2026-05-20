# Settlement Use Cases

## Settlement Use Case Diagram

```mermaid
graph TB
    Payer((Payer))
    Payee((Payee))
    User((User))
    
    subgraph Settlement["Settlement Management"]
        CreateSettle["Create Settlement<br/>with Allocations"]
        ViewSettle["View Settlement"]
        UpdateSettle["Update Settlement"]
        DeleteSettle["Delete Settlement"]
        ViewGroupSettle["View Group<br/>Settlements"]
    end
    
    subgraph AllocationMgmt["Allocation Management"]
        AllocTrans["Allocate to<br/>Transaction"]
        ValidAlloc["Validate<br/>Allocation Amount"]
        PreventOverpay["Prevent<br/>Overpayment"]
    end
    
    subgraph Validation["Settlement Validation"]
        ValidAuth["Validate Authorization<br/>(Payer creates)"]
        ValidCurrency["Validate Currency"]
        ValidSum["Validate Sum of<br/>Allocations = Amount"]
    end
    
    Payer -->|creates| CreateSettle
    Payee -->|views| ViewSettle
    Payer -->|updates note| UpdateSettle
    Payer -->|can delete| DeleteSettle
    Payee -->|can delete| DeleteSettle
    User -->|queries| ViewGroupSettle
    
    CreateSettle -.->|includes| AllocTrans
    CreateSettle -.->|requires| ValidAuth
    CreateSettle -.->|requires| ValidCurrency
    CreateSettle -.->|requires| ValidSum
    
    AllocTrans -.->|checks| ValidAlloc
    AllocTrans -.->|prevents| PreventOverpay
    
    UpdateSettle -.->|restricted to| ValidAuth
    DeleteSettle -.->|restricted to| ValidAuth
```

## Settlement Authorization Matrix

```mermaid
graph TB
    Settlement["Settlement<br/>exists"]
    
    subgraph Create["CREATE: POST /api/settlements"]
        C1["✓ Payer can create"]
        C2["✗ Payee cannot create"]
        C3["✗ Other users cannot create"]
    end
    
    subgraph Update["UPDATE: PUT /api/settlements"]
        U1["✓ Payer can update"]
        U2["✗ Payee cannot update"]
        U3["✗ Other users cannot update"]
    end
    
    subgraph Delete["DELETE /api/settlements"]
        D1["✓ Payer can delete"]
        D2["✓ Payee can delete"]
        D3["✗ Other users cannot delete"]
    end
    
    subgraph View["VIEW/GET"]
        V1["✓ Payer can view"]
        V2["✓ Payee can view"]
        V3["✓ Group members can view group settlements"]
    end
    
    Settlement --> Create
    Settlement --> Update
    Settlement --> Delete
    Settlement --> View
```

## Settlement Allocation Validation Flow

```mermaid
graph TD
    Start["User creates settlement<br/>with allocations"] --> Step1["Calculate remaining owed<br/>for each allocation"]
    
    Step1 --> Check1{"Is each allocation ≤<br/>remaining owed?"}
    
    Check1 -->|No| Fail1["❌ Reject<br/>Overpayment detected"]
    
    Check1 -->|Yes| Step2["Sum all allocations"]
    
    Step2 --> Check2{"Does allocation sum<br/>== settlement amount?"}
    
    Check2 -->|No| Fail2["❌ Reject<br/>Sum mismatch"]
    
    Check2 -->|Yes| Step3["Verify user is payer"]
    
    Step3 --> Check3{"userId ==<br/>payer?"}
    
    Check3 -->|No| Fail3["❌ Reject<br/>Not authorized"]
    
    Check3 -->|Yes| Success["✓ Create settlement<br/>and allocations"]
    
    Success --> End["Transaction member<br/>balances updated"]
    
    style Start fill:#fff3cd
    style End fill:#d4edda
    style Fail1 fill:#f8d7da
    style Fail2 fill:#f8d7da
    style Fail3 fill:#f8d7da
    style Success fill:#d4edda
```

## Settlement State Diagram

```mermaid
stateDiagram-v2
    [*] --> Created: POST /api/settlements
    
    Created --> Active: Validation passed
    
    Active --> Active: View operations
    
    Active --> Updated: PUT /api/settlements (payer only)
    Updated --> Active
    
    Active --> Deleted: DELETE by payer or payee
    Updated --> Deleted: DELETE by payer or payee
    
    Deleted --> [*]
    Active --> [*]: Completed
    
    note right of Active
        While settlement exists:
        - Transaction balances reflect
          this settlement's allocations
        - remainingOwed decreases
        - settledAmount increases
    end note
```

## Settlement Allocation Linkage

```mermaid
graph TB
    Settle["Settlement<br/>(Bob pays Alice $150)"]
    
    Alloc1["Allocation 1<br/>$100 to Hotel<br/>from Bob"]
    Alloc2["Allocation 2<br/>$50 to Dinner<br/>from Bob"]
    
    Trans1["Hotel Transaction<br/>(Alice paid $100)<br/>Bob owes $100"]
    Trans2["Dinner Transaction<br/>(Alice paid $60)<br/>Bob owes $60"]
    
    BalMem1["Hotel Member Balance<br/>totalOwed: $100<br/>settledAmount: $100<br/>remainingOwed: $0"]
    
    BalMem2["Dinner Member Balance<br/>totalOwed: $60<br/>settledAmount: $50<br/>remainingOwed: $10"]
    
    Settle -->|creates| Alloc1
    Settle -->|creates| Alloc2
    
    Alloc1 -->|links to| Trans1
    Alloc2 -->|links to| Trans2
    
    Trans1 -->|updates| BalMem1
    Trans2 -->|updates| BalMem2
    
    style Settle fill:#fff3cd
    style Alloc1 fill:#cce5ff
    style Alloc2 fill:#cce5ff
    style BalMem1 fill:#d4edda
    style BalMem2 fill:#d4edda
```

## Settlement API Endpoints

```mermaid
graph TB
    POST["POST /api/settlements"] -->|Create| CreateSettle["Returns:<br/>SettlementResponseDto"]
    
    GET1["GET /api/settlements/{groupId}"] -->|List| ListSettle["Returns:<br/>List&lt;SettlementResponseDto&gt;<br/>with allocations"]
    
    PUT["PUT /api/settlements"] -->|Update| UpdateSettle["Returns:<br/>SettlementResponseDto<br/>Payer only"]
    
    DELETE["DELETE /api/settlements"] -->|Remove| DelSettle["Returns:<br/>204 No Content<br/>Payer or payee"]
    
    style CreateSettle fill:#d4edda
    style ListSettle fill:#cce5ff
    style UpdateSettle fill:#cce5ff
    style DelSettle fill:#f8d7da
```

## Multi-Settlement Payment Scenario

```mermaid
graph LR
    subgraph Scenario["Bob pays Alice in 3 settlements"]
        S1["Settlement 1<br/>$100 for hotel"]
        S2["Settlement 2<br/>$60 for dinner"]
        S3["Settlement 3<br/>$50 for uber"]
    end
    
    subgraph Impact["Cumulative Impact"]
        B["Before: Bob owes $210<br/>settled $0<br/>remaining $210"]
        A1["After S1: settled $100<br/>remaining $110"]
        A2["After S2: settled $160<br/>remaining $50"]
        A3["After S3: settled $210<br/>remaining $0 ✓"]
    end
    
    B --> S1
    S1 --> A1
    A1 --> S2
    S2 --> A2
    A2 --> S3
    S3 --> A3
    
    style B fill:#fff3cd
    style A1 fill:#cce5ff
    style A2 fill:#cce5ff
    style A3 fill:#d4edda
```
