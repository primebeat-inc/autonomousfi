// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.27;

/// @notice ERC20-locked escrow with timeout, matching MockChain.escrowLock/release/refund semantics.
/// @dev Sprint 2 implements this interface. Spec: docs/superpowers/specs/2026-05-12-sprint-2-design.md
interface IEscrowVault {
    enum EscrowStatus {
        Unknown,
        Locked,
        Released,
        Refunded
    }

    /// @dev Mirror of `ERR_UNKNOWN_TASK` from packages/sdk/src/errors.ts
    error UnknownTask(bytes32 taskHash);
    /// @dev Mirror of `ERR_ALREADY_RELEASED`
    error AlreadyReleased(bytes32 taskHash);
    /// @dev Mirror of `ERR_ALREADY_REFUNDED`
    error AlreadyRefunded(bytes32 taskHash);
    /// @dev Caller has not approved enough ERC20 to the vault
    error InsufficientApproval(uint256 requested, uint256 approved);
    /// @dev Refund requested before the deadline elapsed
    error DeadlineNotReached(uint256 deadline, uint256 currentTime);

    event TaskLocked(bytes32 indexed taskHash, address indexed requester, address indexed provider, uint256 amount, uint256 deadline);
    event TaskReleased(bytes32 indexed taskHash, address indexed provider, uint256 amount);
    event TaskRefunded(bytes32 indexed taskHash, address indexed requester, uint256 amount);

    /// @notice Lock USDT into escrow for a specific task. Caller must have approved `amount` to this vault.
    /// @param requester The address whose USDT is being locked
    /// @param provider The address that will receive funds on settle
    /// @param taskHash Unique identifier for the task
    /// @param amount USDT amount in atomic units
    /// @param deadline Timestamp after which the requester can refund unilaterally
    function lock(address requester, address provider, bytes32 taskHash, uint256 amount, uint256 deadline) external;

    /// @notice Release the locked funds to the provider. Operator only.
    function release(bytes32 taskHash) external;

    /// @notice Refund the locked funds to the requester. Operator or post-deadline.
    function refund(bytes32 taskHash) external;

    /// @notice Read-only status query.
    function getStatus(bytes32 taskHash) external view returns (EscrowStatus);
}
