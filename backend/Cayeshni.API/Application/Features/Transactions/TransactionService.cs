using Cayeshni.API.Application.Common.Exceptions;
using Cayeshni.API.Domain.Entities;
using Cayeshni.API.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Cayeshni.API.Application.Features.Transactions;

public class TransactionService
{
    private readonly AppDbContext _context;

    public TransactionService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<TransactionResponseDto> CreateTransactionAsync(Guid userId, CreateTransactionDto dto)
    {
        // Verify user is in the group
        var group = await _context.Groups
            .Include(g => g.Members)
            .FirstOrDefaultAsync(g => g.Id == dto.GroupId)
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

        _context.Transactions.Add(transaction);
        await _context.SaveChangesAsync();

        var members = transaction.TransactionMembers
            .Select(tm => new TransactionMemberDto(tm.UserId, tm.AmountOwed))
            .ToList();

        var payerName = await _context.Users
            .Where(u => u.Id == userId)
            .Select(u => u.Name)
            .FirstOrDefaultAsync() ?? string.Empty;

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
        var transactions = await _context.Transactions
            .Where(t => t.GroupId == groupId)
            .Include(t => t.TransactionMembers)
            .ToListAsync();

        var payerIds = transactions.Select(t => t.PaidByUserId).Distinct().ToList();
        var payerNames = await _context.Users
            .Where(u => payerIds.Contains(u.Id))
            .ToDictionaryAsync(u => u.Id, u => u.Name);

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
        var transaction = await _context.Transactions
            .Include(t => t.TransactionMembers)
            .Include(t => t.Allocations)
            .FirstOrDefaultAsync(t => t.Id == transactionId)
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
        var transaction = await _context.Transactions
            .FirstOrDefaultAsync(t => t.Id == transactionId)
            ?? throw new NotFoundException(nameof(Transaction), transactionId);

        // Only the person who paid can delete
        if (transaction.PaidByUserId != userId)
            throw new ValidationException("Only the person who paid for this transaction can delete it.");

        // Cannot delete if there are settlements
        var hasSettlements = await _context.SettlementAllocations
            .AnyAsync(sa => sa.TransactionId == transactionId);

        if (hasSettlements)
            throw new ValidationException("Cannot delete transaction with existing settlements. Delete settlements first.");

        _context.Transactions.Remove(transaction);
        await _context.SaveChangesAsync();
    }

    public async Task<List<TransactionMemberBalanceDto>> GetGroupDebtsAsync(Guid groupId)
    {
        var groupMembers = await _context.Groups
            .Where(g => g.Id == groupId)
            .Include(g => g.Members)
            .Select(g => g.Members.Select(m => m.UserId))
            .FirstOrDefaultAsync()
            ?? throw new NotFoundException(nameof(Group), groupId);

        var debts = new Dictionary<Guid, (decimal owed, decimal settled)>();

        // Initialize all members
        foreach (var memberId in groupMembers)
        {
            debts[memberId] = (0, 0);
        }

        // Sum all transaction amounts owed
        var transactionMembers = await _context.TransactionMembers
            .Include(tm => tm.Transaction)
            .Where(tm => tm.Transaction.GroupId == groupId)
            .Include(tm => tm.Allocations)
            .ToListAsync();

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
}
