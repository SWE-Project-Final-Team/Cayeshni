using Cayeshni.API.Application.Common.Exceptions;
using Cayeshni.API.Application.Common.Interfaces;
using Cayeshni.API.Domain.Entities;

namespace Cayeshni.API.Application.Features.Settlements;

public class SettlementService : ISettlementService
{
    private readonly ISettlementRepository _repo;

    public SettlementService(ISettlementRepository repo)
    {
        _repo = repo;
    }

    public async Task<SettlementResponseDto> CreateSettlementAsync(Guid userId, CreateSettlementDto dto)
    {
        // Verify user is the payer (or has authority to create on behalf)
        // This can be enhanced with authorization checks
        if (userId != dto.PayerUserId)
            throw new ValidationException("User can only create settlements as the payer.");

        // Fetch the group to validate currency and membership
        var group = await _repo.GetGroupWithMembersAsync(dto.GroupId)
            ?? throw new NotFoundException(nameof(Group), dto.GroupId);

        var memberIds = group.Members.Select(m => m.UserId).ToHashSet();
        if (!memberIds.Contains(dto.PayerUserId) || !memberIds.Contains(dto.PayeeUserId))
            throw new ValidationException("Payer and payee must be members of the group.");

        if (dto.PayerUserId == dto.PayeeUserId)
            throw new ValidationException("Payer and payee must be different users.");

        // Validate currency matches group's default currency
        if (dto.Currency != group.DefaultCurrency)
            throw new ValidationException($"Settlement currency must match group's default currency ({group.DefaultCurrency}).");

        // Validate that total amount equals sum of allocations
        var totalAllocated = dto.Allocations.Sum(a => a.AllocatedAmount);
        if (totalAllocated != dto.Amount)
            throw new ValidationException($"Settlement amount ({dto.Amount}) must equal sum of allocations ({totalAllocated}).");

        // Load transactions for this group to validate allocations
        var transactions = await _repo.GetTransactionsByGroupIdAsync(dto.GroupId);

        foreach (var allocation in dto.Allocations)
        {
            var transaction = transactions.FirstOrDefault(t => t.Id == allocation.TransactionId)
                ?? throw new NotFoundException(nameof(Transaction), allocation.TransactionId);

            if (transaction.GroupId != dto.GroupId)
                throw new ValidationException($"Transaction {allocation.TransactionId} does not belong to this group.");

            var transactionMember = transaction.TransactionMembers
                .FirstOrDefault(tm => tm.UserId == allocation.DebtorUserId)
                ?? throw new ValidationException($"User {allocation.DebtorUserId} is not part of transaction {allocation.TransactionId}.");

            // Calculate remaining amount owed
            var alreadySettled = await _repo.SumExistingAllocationsForTransactionAndDebtorAsync(allocation.TransactionId, allocation.DebtorUserId);

            var remainingOwed = transactionMember.AmountOwed - alreadySettled;
            if (allocation.AllocatedAmount > remainingOwed)
                throw new ValidationException(
                    $"Allocated amount ({allocation.AllocatedAmount}) exceeds remaining amount owed ({remainingOwed}) for user {allocation.DebtorUserId} in transaction {allocation.TransactionId}.");
        }

        // Create the settlement
        var settlement = new Settlement
        {
            GroupId = dto.GroupId,
            PayerUserId = dto.PayerUserId,
            PayeeUserId = dto.PayeeUserId,
            Amount = dto.Amount,
            Currency = dto.Currency,
            note = dto.Note,
            CreatedAt = DateTime.UtcNow
        };

        await _repo.AddSettlementAsync(settlement);
        await _repo.SaveChangesAsync();

        // Create allocation records
        var allocations = dto.Allocations.Select(allocation => new SettlementAllocation
        {
            SettlementId = settlement.Id,
            TransactionId = allocation.TransactionId,
            DebtorUserId = allocation.DebtorUserId,
            AllocatedAmount = allocation.AllocatedAmount
        }).ToList();

        await _repo.AddSettlementAllocationsAsync(allocations);
        await _repo.SaveChangesAsync();

        return new SettlementResponseDto(
            settlement.Id,
            settlement.GroupId,
            settlement.PayerUserId,
            settlement.PayeeUserId,
            settlement.Amount,
            settlement.Currency,
            settlement.CreatedAt,
            settlement.note,
            dto.Allocations
        );
    }

    public async Task DeleteSettlementAsync(Guid userId, SettlementResponseDto settlement)
    {
        var entity = await _repo.GetSettlementWithAllocationsAsync(settlement.Id)
            ?? throw new NotFoundException(nameof(Settlement), settlement.Id);

        // Authorization: only payer or payee can delete
        if (userId != entity.PayerUserId && userId != entity.PayeeUserId)
            throw new ValidationException("Only payer or payee can delete this settlement.");

        await _repo.RemoveSettlementAsync(entity);
        await _repo.SaveChangesAsync();
    }

    public async Task UpdateSettlementAsync(Guid userId, SettlementResponseDto settlement)
    {
        var entity = await _repo.GetSettlementWithAllocationsAsync(settlement.Id)
            ?? throw new NotFoundException(nameof(Settlement), settlement.Id);

        // Authorization: only payer can update
        if (userId != entity.PayerUserId)
            throw new ValidationException("Only the payer can update a settlement.");

        // For now, allow updating the note only
        entity.note = settlement.Note;

        await _repo.SaveChangesAsync();
    }

    public async Task<List<SettlementResponseDto>> GetGroupSettlementsAsync(Guid userId, Guid groupId)
    {
        var group = await _repo.GetGroupWithMembersAsync(groupId)
            ?? throw new NotFoundException(nameof(Group), groupId);

        if (!group.Members.Any(m => m.UserId == userId))
            throw new ValidationException("User is not a member of this group.");

        var settlements = await _repo.GetSettlementsByGroupIdAsync(groupId);

        return settlements.Select(s => new SettlementResponseDto(
            s.Id,
            s.GroupId,
            s.PayerUserId,
            s.PayeeUserId,
            s.Amount,
            s.Currency,
            s.CreatedAt,
            s.note,
            s.Allocations.Select(a => new SettlementAllocationDto(
                a.TransactionId,
                a.DebtorUserId,
                a.AllocatedAmount
            )).ToList()
        )).ToList();
    }
}
