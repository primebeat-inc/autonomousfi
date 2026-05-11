// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.27;

/// @notice ERC20-locked provider stake with slash + refund, matching MockChain.hostage* semantics.
/// @dev Sprint 2 implements. Spec: docs/superpowers/specs/2026-05-12-sprint-2-design.md
interface IHostageBond {
    enum HostageStatus {
        Unknown,
        Staked,
        Refunded,
        Slashed
    }

    /// @dev Mirror of `ERR_UNKNOWN_TASK` from packages/sdk/src/errors.ts
    error UnknownTask(bytes32 taskHash);
    /// @dev Mirror of `ERR_HOSTAGE_ALREADY_RESOLVED`
    error HostageAlreadyResolved(bytes32 taskHash);
    /// @dev Caller has not approved enough ERC20 to the bond
    error InsufficientApproval(uint256 requested, uint256 approved);

    event HostageStaked(bytes32 indexed taskHash, address indexed provider, uint256 amount);
    event HostageRefunded(bytes32 indexed taskHash, address indexed provider, uint256 amount);
    event HostageSlashed(bytes32 indexed taskHash, address indexed recipient, uint256 amount);

    /// @notice Provider stakes USDT for a task. Caller must have approved `amount` to this bond.
    function stake(bytes32 taskHash, address provider, uint256 amount) external;

    /// @notice Return the stake to the provider on successful settlement. Operator only.
    function refund(bytes32 taskHash) external;

    /// @notice Send the stake to a recipient (typically the requester) on dispute resolution. Operator only.
    function slash(bytes32 taskHash, address recipient) external;

    /// @notice Read-only status query.
    function getStatus(bytes32 taskHash) external view returns (HostageStatus);
}
