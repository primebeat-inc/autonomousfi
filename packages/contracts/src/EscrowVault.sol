// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.27;

import {IEscrowVault} from "./interfaces/IEscrowVault.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract EscrowVault is IEscrowVault, AccessControl, ReentrancyGuard {
    using SafeERC20 for IERC20;

    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");

    IERC20 public immutable token;

    struct Escrow {
        address requester;
        address provider;
        uint256 amount;
        uint256 deadline;
        EscrowStatus status;
    }

    mapping(bytes32 => Escrow) private _escrows;

    constructor(address token_, address operator_) {
        token = IERC20(token_);
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(OPERATOR_ROLE, operator_);
    }

    function lock(
        address requester,
        address provider,
        bytes32 taskHash,
        uint256 amount,
        uint256 deadline
    ) external onlyRole(OPERATOR_ROLE) nonReentrant {
        _escrows[taskHash] = Escrow({
            requester: requester,
            provider: provider,
            amount: amount,
            deadline: deadline,
            status: EscrowStatus.Locked
        });
        token.safeTransferFrom(requester, address(this), amount);
        emit TaskLocked(taskHash, requester, provider, amount, deadline);
    }

    function release(bytes32 taskHash) external onlyRole(OPERATOR_ROLE) nonReentrant {
        Escrow storage e = _escrows[taskHash];
        if (e.status == EscrowStatus.Unknown) revert UnknownTask(taskHash);
        if (e.status == EscrowStatus.Released) revert AlreadyReleased(taskHash);
        if (e.status == EscrowStatus.Refunded) revert AlreadyRefunded(taskHash);
        e.status = EscrowStatus.Released;
        token.safeTransfer(e.provider, e.amount);
        emit TaskReleased(taskHash, e.provider, e.amount);
    }

    function refund(bytes32 taskHash) external nonReentrant {
        Escrow storage e = _escrows[taskHash];
        if (e.status == EscrowStatus.Unknown) revert UnknownTask(taskHash);
        if (e.status == EscrowStatus.Released) revert AlreadyReleased(taskHash);
        if (e.status == EscrowStatus.Refunded) revert AlreadyRefunded(taskHash);
        if (!hasRole(OPERATOR_ROLE, msg.sender) && block.timestamp < e.deadline) {
            revert DeadlineNotReached(e.deadline, block.timestamp);
        }
        e.status = EscrowStatus.Refunded;
        token.safeTransfer(e.requester, e.amount);
        emit TaskRefunded(taskHash, e.requester, e.amount);
    }

    function getStatus(bytes32 taskHash) external view returns (EscrowStatus) {
        return _escrows[taskHash].status;
    }
}
