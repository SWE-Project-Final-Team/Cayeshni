namespace Cayeshni.Domain.Enums;

public enum NotificationType
{
    // Friend events — GroupId will be null
    FriendRequestReceived = 0,
    FriendRequestAccepted = 1,

    // Group events
    GroupInviteReceived   = 2,
    GroupJoinApproved     = 3,
    GroupJoinDeclined     = 4,

    // Transaction events
    TransactionCreated    = 5,
    TransactionUpdated    = 6,

    // Settlement events
    PaymentReceived       = 7,
}

