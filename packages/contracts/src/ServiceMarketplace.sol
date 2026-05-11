// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.27;

import {IServiceMarketplace} from "./interfaces/IServiceMarketplace.sol";
import {IEscrowVault} from "./interfaces/IEscrowVault.sol";
import {IHostageBond} from "./interfaces/IHostageBond.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract ServiceMarketplace is IServiceMarketplace, AccessControl, ReentrancyGuard {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    IEscrowVault public immutable escrow;
    IHostageBond public immutable bond;

    struct Task {
        address requester;
        address provider;
        uint256 price;
        uint256 stake;
        bytes32 qualityHash;
        bytes32 resultHash;
        uint256 deadline;
        TaskStatus status;
    }

    mapping(bytes32 => Task) private _tasks;

    error TaskAlreadyExists(bytes32 taskHash);
    error SelfDealing(address actor);
    error ZeroAmount();
    error ZeroRecipient();

    event TaskSlashed(bytes32 indexed taskHash, address indexed recipient);

    constructor(address escrow_, address bond_, address admin_) {
        if (admin_ == address(0)) revert ZeroRecipient();
        escrow = IEscrowVault(escrow_);
        bond = IHostageBond(bond_);
        _grantRole(DEFAULT_ADMIN_ROLE, admin_);
        _grantRole(ADMIN_ROLE, admin_);
    }

    function createTask(
        address provider,
        bytes32 taskHash,
        uint256 price,
        uint256 stake,
        bytes32 qualityHash,
        uint256 deadline
    ) external nonReentrant {
        if (_tasks[taskHash].status != TaskStatus.Unknown) revert TaskAlreadyExists(taskHash);
        if (provider == msg.sender) revert SelfDealing(msg.sender);
        if (price == 0 || stake == 0) revert ZeroAmount();

        _tasks[taskHash] = Task({
            requester: msg.sender,
            provider: provider,
            price: price,
            stake: stake,
            qualityHash: qualityHash,
            resultHash: bytes32(0),
            deadline: deadline,
            status: TaskStatus.Created
        });

        // External calls AFTER state write (CEI). Both must succeed or the whole tx reverts.
        escrow.lock(msg.sender, provider, taskHash, price, deadline);
        bond.stake(taskHash, provider, stake);

        emit TaskCreated(taskHash, msg.sender, provider, price, stake, qualityHash, deadline);
    }

    function submitResult(bytes32 taskHash, bytes32 resultHash) external nonReentrant {
        Task storage t = _tasks[taskHash];
        if (t.status == TaskStatus.Unknown) revert UnknownTask(taskHash);
        if (msg.sender != t.provider) revert NotProvider(taskHash, msg.sender, t.provider);
        if (t.status != TaskStatus.Created) revert WrongTaskStatus(taskHash, TaskStatus.Created, t.status);

        t.resultHash = resultHash;
        t.status = TaskStatus.Submitted;

        emit ResultSubmitted(taskHash, resultHash);
    }

    function settle(bytes32 taskHash) external nonReentrant {
        Task storage t = _tasks[taskHash];
        if (t.status == TaskStatus.Unknown) revert UnknownTask(taskHash);
        if (msg.sender != t.requester) revert NotRequester(taskHash, msg.sender, t.requester);
        if (t.status != TaskStatus.Submitted) revert WrongTaskStatus(taskHash, TaskStatus.Submitted, t.status);

        t.status = TaskStatus.Settled;

        escrow.release(taskHash);
        bond.refund(taskHash);

        emit TaskSettled(taskHash);
    }

    function dispute(bytes32 taskHash, string calldata reason) external nonReentrant {
        Task storage t = _tasks[taskHash];
        if (t.status == TaskStatus.Unknown) revert UnknownTask(taskHash);
        if (msg.sender != t.requester) revert NotRequester(taskHash, msg.sender, t.requester);
        if (t.status != TaskStatus.Submitted) revert WrongTaskStatus(taskHash, TaskStatus.Submitted, t.status);

        t.status = TaskStatus.Disputed;

        emit TaskDisputed(taskHash, reason);
    }

    function resolveDispute(bytes32 taskHash, bool inFavorOfRequester) external onlyRole(ADMIN_ROLE) nonReentrant {
        Task storage t = _tasks[taskHash];
        if (t.status == TaskStatus.Unknown) revert UnknownTask(taskHash);
        if (t.status != TaskStatus.Disputed) revert WrongTaskStatus(taskHash, TaskStatus.Disputed, t.status);

        if (inFavorOfRequester) {
            t.status = TaskStatus.Slashed;
            escrow.refund(taskHash);
            bond.slash(taskHash, t.requester);
            emit TaskSlashed(taskHash, t.requester);
        } else {
            t.status = TaskStatus.Settled;
            escrow.release(taskHash);
            bond.refund(taskHash);
            emit TaskSettled(taskHash);
        }
    }

    function getStatus(bytes32 taskHash) external view returns (TaskStatus) {
        return _tasks[taskHash].status;
    }

    function getTask(bytes32 taskHash) external view returns (Task memory) {
        return _tasks[taskHash];
    }
}
