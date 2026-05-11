# Transactions & Settlements: Practical Example

## Vacation Group Scenario

A group of 3 friends planning a weekend trip.

```mermaid
graph TB
    A["Alice<br/>(Organizer)"] 
    B["Bob"]
    C["Charlie"]
    G["Vacation<br/>Group"]
    
    A -->|creates| G
    B -->|joins| G
    C -->|joins| G
    
    style G fill:#fff3cd
```

## Transactions Flow

### Alice pays for hotel

```
Alice: "I paid $300 for the hotel, everyone stayed there"
- Transaction 1: $300 total
  - Alice paid
  - Bob owes $100
  - Charlie owes $100
  - Alice gets back $100
```

**System creates:**
- Transaction entity (id: txn-1, total: $300, paidBy: Alice)
- TransactionMember: Bob → $100
- TransactionMember: Charlie → $100
- TransactionMember: Alice → $100

### Alice pays for meals

```
Alice: "I bought group meals for $150"
- Transaction 2: $150 total
  - Alice paid
  - Bob owes $75
  - Charlie owes $75
```

**System creates:**
- Transaction entity (id: txn-2, total: $150, paidBy: Alice)
- TransactionMember: Bob → $75
- TransactionMember: Charlie → $75

### Bob pays for transportation

```
Bob: "I paid for the Uber, split 3 ways"
- Transaction 3: $60 total
  - Bob paid
  - Alice owes $20
  - Charlie owes $20
```

**System creates:**
- Transaction entity (id: txn-3, total: $60, paidBy: Bob)
- TransactionMember: Alice → $20
- TransactionMember: Charlie → $20

## Current Debts

```mermaid
graph TB
    subgraph Debts["Who Owes What"]
        BA["Bob owes Alice<br/>Hotel: $100<br/>Meals: $75<br/>Total: $175"]
        CA["Charlie owes Alice<br/>Hotel: $100<br/>Meals: $75<br/>Total: $175"]
        AB["Alice owes Bob<br/>Uber: $20"]
        CB["Charlie owes Bob<br/>Uber: $20"]
        AC["Alice owes Charlie<br/>None: $0"]
        BC["Bob owes Charlie<br/>None: $0"]
    end
    
    style BA fill:#f8d7da
    style CA fill:#f8d7da
    style AB fill:#f8d7da
    style CB fill:#f8d7da
```

## Group Debts Overview

```
Query: GET /api/transactions/group/{groupId}/debts

Alice:
- totalOwed: $20 (owes Bob for Uber)
- settledAmount: $0
- remainingOwed: $20

Bob:
- totalOwed: $175 (owes Alice)
- settledAmount: $0
- remainingOwed: $175

Charlie:
- totalOwed: $195 (owes Alice $175 + Bob $20)
- settledAmount: $0
- remainingOwed: $195
```

## Settlement 1: Bob Pays Alice

```
Bob creates: "Settling for the hotel meal split"
Settlement:
  - Amount: $175
  - Payer: Bob
  - Payee: Alice
  - Allocations:
    1. Hotel (txn-1): $100 (clears Bob's hotel debt)
    2. Meals (txn-2): $75 (clears Bob's meal debt)
```

**System validates:**
```mermaid
graph TD
    Check1{"$100 ≤ remaining<br/>on hotel?"} -->|Yes| Check2
    Check2{"$75 ≤ remaining<br/>on meals?"} -->|Yes| Check3
    Check3{"$100 + $75 =<br/>$175?"} -->|Yes| Check4
    Check4{"Bob is payer<br/>requesting?"} -->|Yes| Create["✓ Settlement created"]
    
    style Create fill:#d4edda
```

**Impact on balances:**

```mermaid
graph LR
    B1["Bob before:<br/>Hotel debt: $100<br/>settledAmount: $0<br/>remaining: $100"] -->|Settlement $100| B2["After allocation 1:<br/>settledAmount: $100<br/>remaining: $0"]
    
    M1["Bob before:<br/>Meals debt: $75<br/>settledAmount: $0<br/>remaining: $75"] -->|Settlement $75| M2["After allocation 2:<br/>settledAmount: $75<br/>remaining: $0"]
    
    style B1 fill:#fff3cd
    style B2 fill:#d4edda
    style M1 fill:#fff3cd
    style M2 fill:#d4edda
```

## Settlement 2: Charlie Pays Alice

```
Charlie creates: "Paying for my hotel and meal split"
Settlement:
  - Amount: $175
  - Payer: Charlie
  - Payee: Alice
  - Allocations:
    1. Hotel (txn-1): $100
    2. Meals (txn-2): $75
```

**Result:**
- Charlie's debt to Alice: CLEARED ($175 paid)
- Alice's status:
  - Paid by Bob: $175 ✓
  - Paid by Charlie: $175 ✓
  - Net: $0

## Settlement 3: Charlie Pays Bob

```
Charlie creates: "Paying for the Uber ride"
Settlement:
  - Amount: $20
  - Payer: Charlie
  - Payee: Bob
  - Allocations:
    1. Uber (txn-3): $20
```

## Settlement 4: Alice Pays Bob

```
Alice creates: "Paying for my share of the Uber"
Settlement:
  - Amount: $20
  - Payer: Alice
  - Payee: Bob
  - Allocations:
    1. Uber (txn-3): $20
```

## Final Group Debts

```
Query: GET /api/transactions/group/{groupId}/debts

Alice:
- totalOwed: $20
- settledAmount: $20 ✓
- remainingOwed: $0

Bob:
- totalOwed: $175
- settledAmount: $175 ✓
- remainingOwed: $0

Charlie:
- totalOwed: $195
- settledAmount: $195 ✓
- remainingOwed: $0

✓ ALL SETTLED
```

## Settlement Timeline

```mermaid
timeline
    title Vacation Trip Settlement Timeline
    
    Day 1 : Alice pays $300 hotel : Alice pays $150 meals : Bob pays $60 Uber
    
    Day 2 : Bob settles $175 : Charlie settles $175
    
    Day 3 : Charlie settles $20 : Alice settles $20
    
    End : All balances cleared
```

## Allocation Linkage Visualization

```mermaid
graph TB
    subgraph Settlement1["Settlement 1: Bob → Alice ($175)"]
        S1["Settlement $175"]
        A1["Allocation to Hotel"]
        A2["Allocation to Meals"]
        S1 --> A1
        S1 --> A2
    end
    
    subgraph Settlement2["Settlement 2: Charlie → Alice ($175)"]
        S2["Settlement $175"]
        A3["Allocation to Hotel"]
        A4["Allocation to Meals"]
        S2 --> A3
        S2 --> A4
    end
    
    subgraph Settlement3["Settlement 3: Charlie → Bob ($20)"]
        S3["Settlement $20"]
        A5["Allocation to Uber"]
        S3 --> A5
    end
    
    subgraph Settlement4["Settlement 4: Alice → Bob ($20)"]
        S4["Settlement $20"]
        A6["Allocation to Uber"]
        S4 --> A6
    end
    
    subgraph Transactions["Transactions"]
        T1["Hotel ($300)"]
        T2["Meals ($150)"]
        T3["Uber ($60)"]
    end
    
    A1 -->|allocates $100| T1
    A2 -->|allocates $75| T2
    A3 -->|allocates $100| T1
    A4 -->|allocates $75| T2
    A5 -->|allocates $20| T3
    A6 -->|allocates $20| T3
    
    T1 -->|Bob owes: $0 settled| Hotel["Hotel: ✓ Fully Settled"]
    T2 -->|Bob owes: $0 settled| Meals["Meals: ✓ Fully Settled"]
    T3 -->|Debts: $0 settled| Uber["Uber: ✓ Fully Settled"]
    
    style Hotel fill:#d4edda
    style Meals fill:#d4edda
    style Uber fill:#d4edda
```

## API Calls Summary

```bash
# 1. Create hotel transaction
POST /api/transactions
{
  "groupId": "group-1",
  "totalAmount": 300,
  "currency": "USD",
  "category": "Lodging",
  "description": "Hotel",
  "members": [
    {"userId": "bob-id", "amountOwed": 100},
    {"userId": "charlie-id", "amountOwed": 100},
    {"userId": "alice-id", "amountOwed": 100}
  ]
}

# 2-3. Create meals and Uber transactions
# (similar structure)

# 4. Create Bob's settlement
POST /api/settlements
{
  "groupId": "group-1",
  "payerUserId": "bob-id",
  "payeeUserId": "alice-id",
  "amount": 175,
  "currency": "USD",
  "allocations": [
    {"transactionId": "txn-1", "debtorUserId": "bob-id", "allocatedAmount": 100},
    {"transactionId": "txn-2", "debtorUserId": "bob-id", "allocatedAmount": 75}
  ]
}

# 5-8. Create remaining settlements
# (similar structure)

# View final group debts
GET /api/transactions/group/group-1/debts
```
