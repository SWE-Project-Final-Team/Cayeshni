using Cayeshni.API.Application.Features.Settlements;

namespace Cayeshni.API.Application.Common.Interfaces;

public interface ISettlementService
{
    Task<SettlementResponseDto> CreateSettlementAsync(Guid userId, CreateSettlementDto dto);
    Task DeleteSettlementAsync(Guid userId, SettlementResponseDto settlement);
    Task UpdateSettlementAsync(Guid userId, SettlementResponseDto settlement);
    Task<List<SettlementResponseDto>> GetGroupSettlementsAsync(Guid groupId);
}