using Cayeshni.Application.Common.Exceptions;
using Cayeshni.Application.Features.Transactions;
using Cayeshni.Domain.Entities;

namespace Cayeshni.Application.Features.Transactions;

public class TransactionService
{
    private readonly ITransactionRepository _repo;

    public TransactionService(ITransactionRepository repo)
    {
        _repo = repo;
    }

    public async Task<TransactionResponseDto> CreateTransactionAsync(Guid userId, CreateTransactionDto dto)
    {
        // Verify user is in the group
        var group = await _repo.GetGroupWithMembersAsync(dto.GroupId)
            ?? throw new NotFoundException(nameof(Group), dto.GroupId);

        var userIsMember = group.Members.Any(m => m.UserId == userId);
        if (!userIsMember)
            throw new ValidationException("User is not a member of this group.");

        // Validate currency matches group's default currency
        if (dto.Currency != group.DefaultCurrency)
            throw new ValidationException($"Transaction currency must match group's default currency ({group.DefaultCurrency}).");

        // Validate members are in the group
        var memberIds = dto.Members?.Select(m => m.UserId).ToList() ?? new List<Guid>();
        var invalidMembers = memberIds.Where(id => !group.Members.Any(m => m.UserId == id)).ToList();
        if (invalidMembers.Any())
            throw new ValidationException($"The following users are not members of this group: {string.Join(", ", invalidMembers)}");

        // Validate sum of splits equals total amount
        var totalSplit = dto.Members?.Sum(m => m.AmountOwed) ?? 0;
        if (totalSplit != dto.TotalAmount)
            throw new ValidationException($"Sum of member amounts ({totalSplit}) must equal total transaction amount ({dto.TotalAmount}).");

        // Create the transaction
        var transaction = new Transaction
        {
            GroupId = dto.GroupId,
            PaidByUserId = userId,
            TotalAmount = dto.TotalAmount,
            Currency = dto.Currency,
            Category = dto.Category,
            Description = dto.Description
        };

        // Add transaction members
        if (dto.Members != null)
        {
            foreach (var member in dto.Members)
            {
                transaction.TransactionMembers.Add(new TransactionMember
                {
                    UserId = member.UserId,
                    AmountOwed = member.AmountOwed
                });
            }
        }

        await _repo.AddTransactionAsync(transaction);
        await _repo.SaveChangesAsync();

        var members = transaction.TransactionMembers
            .Select(tm => new TransactionMemberDto(tm.UserId, tm.AmountOwed))
            .ToList();

        var payerName = await _repo.GetUserNameAsync(userId) ?? string.Empty;

        return new TransactionResponseDto(
            transaction.Id,
            transaction.GroupId,
            transaction.PaidByUserId,
            payerName,
            transaction.TotalAmount,
            transaction.Currency,
            transaction.Category,
            transaction.Description,
            transaction.CreatedAt,
            members
        );
    }

    public async Task<List<TransactionResponseDto>> GetGroupTransactionsAsync(Guid groupId)
    {
        var transactions = await _repo.GetTransactionsByGroupIdAsync(groupId);

        var payerIds = transactions.Select(t => t.PaidByUserId).Distinct().ToList();
        var payerNames = new Dictionary<Guid, string>();
        foreach (var pid in payerIds)
        {
            payerNames[pid] = await _repo.GetUserNameAsync(pid) ?? string.Empty;
        }

        return transactions.Select(t => new TransactionResponseDto(
            t.Id,
            t.GroupId,
            t.PaidByUserId,
            payerNames.GetValueOrDefault(t.PaidByUserId) ?? string.Empty,
            t.TotalAmount,
            t.Currency,
            t.Category,
            t.Description,
            t.CreatedAt,
            t.TransactionMembers.Select(tm => new TransactionMemberDto(tm.UserId, tm.AmountOwed)).ToList()
        )).ToList();
    }

    public async Task<TransactionDetailDto> GetTransactionWithBalancesAsync(Guid transactionId)
    {
        var transaction = await _repo.GetTransactionWithIncludesAsync(transactionId)
            ?? throw new NotFoundException(nameof(Transaction), transactionId);

        var membersWithBalance = new List<TransactionMemberBalanceDto>();

        foreach (var member in transaction.TransactionMembers)
        {
            var settledAmount = transaction.Allocations
                .Where(a => a.DebtorUserId == member.UserId)
                .Sum(a => a.AllocatedAmount);

            membersWithBalance.Add(new TransactionMemberBalanceDto(
                member.UserId,
                member.AmountOwed,
                settledAmount,
                member.AmountOwed - settledAmount
            ));
        }

        return new TransactionDetailDto(
            transaction.Id,
            transaction.GroupId,
            transaction.PaidByUserId,
            transaction.TotalAmount,
            transaction.Currency,
            transaction.Category,
            transaction.Description,
            transaction.CreatedAt,
            membersWithBalance
        );
    }

    public async Task DeleteTransactionAsync(Guid userId, Guid transactionId)
    {
        var transaction = await _repo.GetTransactionWithIncludesAsync(transactionId)
            ?? throw new NotFoundException(nameof(Transaction), transactionId);

        // Only the person who paid can delete
        if (transaction.PaidByUserId != userId)
            throw new ValidationException("Only the person who paid for this transaction can delete it.");

        // Cannot delete if there are settlements
        var hasSettlements = await _repo.TransactionHasSettlementsAsync(transactionId);

        if (hasSettlements)
            throw new ValidationException("Cannot delete transaction with existing settlements. Delete settlements first.");

        await _repo.RemoveTransactionAsync(transaction);
        await _repo.SaveChangesAsync();
    }

    public async Task<List<TransactionMemberBalanceDto>> GetGroupDebtsAsync(Guid groupId)
    {
        if (!await _repo.GroupExistsAsync(groupId))
            throw new NotFoundException(nameof(Group), groupId);

        var groupMemberIds = await _repo.GetGroupMemberIdsAsync(groupId);

        var debts = new Dictionary<Guid, (decimal owed, decimal settled)>();

        // Initialize all members
        foreach (var memberId in groupMemberIds)
        {
            debts[memberId] = (0, 0);
        }

        // Sum all transaction amounts owed
        var transactionMembers = await _repo.GetTransactionMembersByTransactionIdsAsync(
            (await _repo.GetTransactionsByGroupIdAsync(groupId)).Select(t => t.Id));

        foreach (var tm in transactionMembers)
        {
            var (owed, settled) = debts[tm.UserId];
            var totalSettled = tm.Allocations.Sum(a => a.AllocatedAmount);
            debts[tm.UserId] = (owed + tm.AmountOwed, settled + totalSettled);
        }

        return debts.Select(kvp => new TransactionMemberBalanceDto(
            kvp.Key,
            kvp.Value.owed,
            kvp.Value.settled,
            kvp.Value.owed - kvp.Value.settled
        )).ToList();
    }

    public async Task<TransactionResponseDto> UpdateTransactionAsync(Guid userId, UpdateTransactionDto dto)
    {
        var transaction = await _repo.GetTransactionWithIncludesAsync(dto.Id)
            ?? throw new NotFoundException(nameof(Transaction), dto.Id);

        // Only the person who paid can edit
        if (transaction.PaidByUserId != userId)
            throw new ValidationException("Only the person who paid for this transaction can edit it.");

        // For now we only allow updating description and category to avoid mutating amounts/splits when settlements exist
        if (dto.Description is not null)
            transaction.Description = dto.Description;

        if (dto.Category is not null)
            transaction.Category = dto.Category.Value;

        await _repo.SaveChangesAsync();

        var members = transaction.TransactionMembers
            .Select(tm => new TransactionMemberDto(tm.UserId, tm.AmountOwed))
            .ToList();

        var payerName = await _repo.GetUserNameAsync(transaction.PaidByUserId) ?? string.Empty;

        return new TransactionResponseDto(
            transaction.Id,
            transaction.GroupId,
            transaction.PaidByUserId,
            payerName,
            transaction.TotalAmount,
            transaction.Currency,
            transaction.Category,
            transaction.Description,
            transaction.CreatedAt,
            members
        );
    }
}

