# Friends Management Sequence Diagrams

## Send Friend Request Flow

```mermaid
sequenceDiagram
    participant User
    participant Controller as FriendsController
    participant Service as FriendService
    participant Normalizer as ILookupNormalizer
    participant DB as AppDbContext
    
    User->>Controller: SendRequest(senderId, dto)
    Controller->>Controller: Extract senderId from Claims
    Controller->>Service: SendRequestAsync(senderId, dto)
    
    Service->>Service: Check if email or userId provided
    alt Both or neither provided
        Service-->>Controller: ValidationException
        Controller-->>User: 400 Bad Request
    else Valid input
        alt Email provided
            Service->>Normalizer: NormalizeEmail(email)
            Service->>DB: Query User by normalized email
            alt User not found
                Service-->>Controller: NotFoundException
                Controller-->>User: 404 Not Found
            else User found
                Service->>Service: Continue with user ID
            end
        end
        
        alt Sender equals receiver
            Service-->>Controller: ValidationException (Self-add)
            Controller-->>User: 400 Bad Request
        else Different users
            Service->>DB: Query existing friendship
            alt Friendship exists
                Service-->>Controller: ValidationException (Duplicate)
                Controller-->>User: 400 Bad Request
            else No existing friendship
                Service->>DB: Create Friendship record<br/>Status = Pending
                Service->>DB: SaveChangesAsync()
                DB-->>Service: Confirm saved
                Service-->>Controller: OK
                Controller-->>User: 200 OK
            end
        end
    end
```

### Process Steps
1. User sends request with target email or user ID
2. Controller extracts sender userId from JWT claims
3. Service validates exactly one identifier provided
4. If email: normalize and query database for user
5. Check if sender and receiver are different users
6. Check for existing friendship (prevent duplicates)
7. Create Friendship entity with status = Pending
8. Persist and return success

---

## Accept Friend Request Flow

```mermaid
sequenceDiagram
    participant User
    participant Controller as FriendsController
    participant Service as FriendService
    participant DB as AppDbContext
    
    User->>Controller: AcceptRequest(currentUserId, requesterId)
    Controller->>Controller: Extract currentUserId from Claims
    Controller->>Service: AcceptRequestAsync(currentUserId, requesterId)
    
    Service->>Service: Order user IDs (smaller first)
    Service->>DB: Query Friendship by (userA, userB)
    
    alt Friendship not found
        Service-->>Controller: NotFoundException
        Controller-->>User: 404 Not Found
    else Friendship found
        Service->>Service: Update status to Friends
        Service->>Service: Set UpdatedAt = current time
        Service->>DB: SaveChangesAsync()
        DB-->>Service: Confirm saved
        Service-->>Controller: OK
        Controller-->>User: 200 OK
    end
```

### Process Steps
1. User sends request with requester ID
2. Controller extracts current user ID from JWT
3. Service orders user IDs consistently (smaller first)
4. Service queries database for friendship with both IDs
5. If not found: return 404 NotFoundException
6. If found: update status from Pending to Friends
7. Record update timestamp
8. Persist and return success

---

## Get Pending Requests Flow

```mermaid
sequenceDiagram
    participant User
    participant Controller as FriendsController
    participant Service as FriendService
    participant DB as AppDbContext
    participant Storage as IFileStorageService
    
    User->>Controller: GetPendingRequests(userId)
    Controller->>Controller: Extract userId from Claims
    Controller->>Service: GetPendingRequestsAsync(userId)
    
    Service->>DB: Query Friendships<br/>Status = Pending<br/>where user is receiver
    DB-->>Service: List<Friendship>
    
    alt No pending requests
        Service-->>Controller: Empty list
        Controller-->>User: 200 OK []
    else Pending requests found
        Service->>DB: Query Users by requester IDs
        DB-->>Service: Dictionary<UserId, User>
        
        loop For each pending request
            Service->>Storage: GetUrl(profilePicturePath)
            Storage-->>Service: Picture URL or null
        end
        
        Service->>Service: Map to PendingFriendRequestDto
        Service-->>Controller: List<PendingFriendRequestDto>
        Controller-->>User: 200 OK with requests
    end
```

### Process Steps
1. User requests pending friend requests
2. Controller extracts user ID from JWT claims
3. Service queries database for pending friendships where user is receiver
4. Service retrieves requester user details
5. Service resolves profile picture URLs
6. Service maps to DTOs with sender info
7. Return list sorted by creation time

---

## Get Friends List Flow

```mermaid
sequenceDiagram
    participant User
    participant Controller as FriendsController
    participant Service as FriendService
    participant DB as AppDbContext
    participant Storage as IFileStorageService
    
    User->>Controller: GetFriends(userId)
    Controller->>Controller: Extract userId from Claims
    Controller->>Service: GetFriendsAsync(userId)
    
    Service->>DB: Query Friendships<br/>Status = Friends<br/>where user is either side
    DB-->>Service: List<Friendship>
    
    alt No friends
        Service-->>Controller: Empty list
        Controller-->>User: 200 OK []
    else Friends found
        Service->>Service: Extract friend IDs<br/>from friendship records
        Service->>DB: Query Users by friend IDs
        DB-->>Service: Dictionary<UserId, User>
        
        loop For each friend
            Service->>Storage: GetUrl(profilePicturePath)
            Storage-->>Service: Picture URL or null
        end
        
        Service->>Service: Map to FriendResponseDto
        Service-->>Controller: List<FriendResponseDto>
        Controller-->>User: 200 OK with friends
    end
```

### Process Steps
1. User requests friends list
2. Controller extracts user ID from JWT
3. Service queries database for accepted friendships
4. Friendship entities store both users (userA, userB)
5. Service identifies friend IDs (the "other" user in each pair)
6. Service retrieves friend details from database
7. Service resolves profile picture URLs from storage service
8. Service maps to DTOs with friend information
9. Return complete friends list

---

## Remove Friend Flow

```mermaid
sequenceDiagram
    participant User
    participant Controller as FriendsController
    participant Service as FriendService
    participant DB as AppDbContext
    
    User->>Controller: RemoveFriend(currentUserId, otherUserId)
    Controller->>Controller: Extract currentUserId from Claims
    Controller->>Service: RemoveFriendAsync(currentUserId, otherUserId)
    
    Service->>Service: Order user IDs (smaller first)
    Service->>DB: Query Friendship by (userA, userB)
    
    alt Friendship not found
        Service-->>Controller: NotFoundException
        Controller-->>User: 404 Not Found
    else Friendship found
        Service->>DB: Remove Friendship entity
        Service->>DB: SaveChangesAsync()
        DB-->>Service: Confirm deleted
        Service-->>Controller: OK
        Controller-->>User: 200 OK
    end
```

### Process Steps
1. User sends remove request with friend ID
2. Controller extracts current user ID from JWT
3. Service orders user IDs consistently
4. Service queries database for friendship
5. If not found: return 404 NotFoundException
6. If found: delete the friendship record
7. Persist deletion and return success

---

## Data Model: Friendship Entity

The `Friendship` entity stores bidirectional relationships:

- **UserIdA**: First user ID (smaller GUID value)
- **UserIdB**: Second user ID (larger GUID value)
- **SenderId**: Who initiated the request
- **Status**: Pending, Friends, or Blocked
- **CreatedAt**: When request was sent
- **UpdatedAt**: When status changed (null until accepted)

### Why Order IDs?
By consistently storing the smaller ID as UserIdA, we ensure:
- Single friendship record per pair (not duplicate records for A→B and B→A)
- Efficient lookups by always querying with ordered IDs
- Bidirectional relationships with minimal storage
