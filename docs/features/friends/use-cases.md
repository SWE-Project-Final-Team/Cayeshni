# Friends Management Use Case Diagram

```mermaid
graph TB
    User((User))
    
    User -->|Send Request| SendRequest["Send Friend Request<br/>by Email or User ID"]
    User -->|Accept| AcceptRequest["Accept Friend Request"]
    User -->|Decline| DeclineRequest["Decline Request<br/>Remove Friendship"]
    User -->|View Pending| GetPending["View Pending Requests"]
    User -->|View Friends| GetFriends["View My Friends"]
    User -->|Remove| RemoveFriend["Remove Friend"]
    
    SendRequest -->|Target Not Found| ValidationError["ValidationException"]
    SendRequest -->|Self-Add| SelfError["Cannot Add Yourself"]
    SendRequest -->|Already Friends| DuplicateError["Friendship Already Exists"]
    AcceptRequest -->|Updates Status| StatusChange["Pending → Friends"]
    DeclineRequest -->|Removes Record| Cleanup["Friendship Removed"]
    RemoveFriend -->|Removes Record| Cleanup
    
    GetPending -->|Pending Status| FilterPending["Filter by Status"]
    GetFriends -->|Friends Status| FilterFriends["Filter by Status"]
    
    style SendRequest fill:#e1f5ff
    style AcceptRequest fill:#c8e6c9
    style DeclineRequest fill:#fff3e0
    style RemoveFriend fill:#ffebee
    style GetPending fill:#f3e5f5
    style GetFriends fill:#f3e5f5
    style StatusChange fill:#f1f8e9
    style Cleanup fill:#fce4ec
    style ValidationError fill:#ffcdd2
    style SelfError fill:#ffcdd2
    style DuplicateError fill:#ffcdd2
    style FilterPending fill:#e0f2f1
    style FilterFriends fill:#e0f2f1
```

## Description

This diagram shows all user interactions with the friend management system:

### Core Operations
- **Send Friend Request**: Users can send requests via email or user ID
  - Validates email format and user existence
  - Prevents self-adds and duplicate requests
  
- **Accept Friend Request**: Accept a pending friend request
  - Updates friendship status from Pending to Friends
  - Records the acceptance timestamp

- **Decline/Remove Friend**: Remove a friendship or pending request
  - Removes the friendship record entirely
  - Available for both pending and accepted friendships

### Retrieval Operations
- **View Pending Requests**: Retrieve all pending friend requests received by the user
  - Includes requester name, email, and profile picture
  - Sorted by request creation time

- **View My Friends**: Retrieve all accepted friendships
  - Lists friend information with profile pictures
  - Only includes Friends status relationships

### Validation Rules
- Cannot add yourself as a friend
- Cannot duplicate friend requests
- Target user must exist (by email or user ID)
- Email must be valid format
- Friendship relationships are bidirectional (stored with ordered IDs)
