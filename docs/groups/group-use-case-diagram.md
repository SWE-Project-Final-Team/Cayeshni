# Group Services Use Case Diagram

```mermaid
graph TB
    User((User))
    
    User -->|Create| CreateGroup["Create Group"]
    User -->|Join| JoinGroup["Join Group<br/>via Invite Token"]
    User -->|View| GetGroups["View My Groups"]
    User -->|Exit| ExitGroup["Exit Group"]
    User -->|Manage| UpdateGroup["Update Group"]
    User -->|Manage| DeleteGroup["Delete Group<br/>Creator Only"]
    
    CreateGroup -->|Generates| InviteToken["Invite Token"]
    JoinGroup -->|Uses| InviteToken
    DeleteGroup -->|Removes| GroupMembers["Group Members"]
    ExitGroup -->|Transfers Owner| RoleTransfer["Transfer Owner Role<br/>if Needed"]
    
    style CreateGroup fill:#e1f5ff
    style JoinGroup fill:#e1f5ff
    style GetGroups fill:#e1f5ff
    style ExitGroup fill:#fff3e0
    style UpdateGroup fill:#f3e5f5
    style DeleteGroup fill:#ffebee
    style InviteToken fill:#f1f8e9
    style GroupMembers fill:#fce4ec
    style RoleTransfer fill:#f1f8e9
```

## Description

This diagram shows all user interactions with the group management system:

- **Create Group**: Users can create new groups (auto-generates invite token)
- **Join Group**: Users can join existing groups using an invite token
- **View My Groups**: Users can retrieve all groups they're members of
- **Exit Group**: Users can leave a group (triggers owner transfer if needed)
- **Update Group**: Group creators can update group details
- **Delete Group**: Only group creators can delete groups (removes all members)

The diagram also illustrates key relationships:
- Invite tokens are generated on group creation and used for joining
- Group deletion removes all associated members
- Exiting as creator triggers automatic owner role transfer to the oldest member
