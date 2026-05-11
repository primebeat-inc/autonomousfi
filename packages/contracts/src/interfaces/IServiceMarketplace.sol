// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.27;

/// @notice Orchestrator that calls EscrowVault and HostageBond in lockstep.
/// @dev Sprint 2 implements. Spec: docs/superpowers/specs/2026-05-12-sprint-2-design.md
interface IServiceMarketplace {
    enum TaskStatus {
        Unknown,
        Created,    // escrow locked + hostage staked
        Submitted,  // result submitted, awaiting settle
        Settled,    // provider paid, hostage refunded
        Slashed,    // requester refunded, hostage slashed
        Disputed    // human-in-the-loop arbitration pending (Phase 4)
    }

    error UnknownTask(bytes32 taskHash);
    error WrongTaskStatus(bytes32 taskHash, TaskStatus expected, TaskStatus actual);
    error NotProvider(bytes32 taskHash, address caller, address provider);
    error NotRequester(bytes32 taskHash, address caller, address requester);

    event TaskCreated(
        bytes32 indexed taskHash,
        address indexed requester,
        address indexed provider,
        uint256 price,
        uint256 stake,
        bytes32 qualityHash,
        uint256 deadline
    );
    event ResultSubmitted(bytes32 indexed taskHash, bytes32 indexed resultHash);
    event TaskSettled(bytes32 indexed taskHash);
    event TaskSlashed(bytes32 indexed taskHash);
    event TaskDisputed(bytes32 indexed taskHash, string reason);

    /// @notice Requester creates a task; this locks the escrow and stakes the provider's hostage in one tx.
    /// @dev Caller and provider must both have pre-approved the escrow and bond contracts.
    function createTask(
        address provider,
        bytes32 taskHash,
        uint256 price,
        uint256 stake,
        bytes32 qualityHash,
        uint256 deadline
    ) external;

    /// @notice Provider submits the result hash for off-chain verification.
    function submitResult(bytes32 taskHash, bytes32 resultHash) external;

    /// @notice Requester settles after verifying the result. Releases escrow, refunds hostage.
    function settle(bytes32 taskHash) external;

    /// @notice Requester disputes the result. Refunds escrow, slashes hostage.
    /// @dev Phase 4 routes this to DAO arbitration; Sprint 2 uses unilateral requester decision.
    function dispute(bytes32 taskHash, string calldata reason) external;

    function getStatus(bytes32 taskHash) external view returns (TaskStatus);
}
