// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.27;

import {IHostageBond} from "./interfaces/IHostageBond.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract HostageBond is IHostageBond, AccessControl, ReentrancyGuard {
    using SafeERC20 for IERC20;

    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");

    IERC20 public immutable token;

    struct Bond {
        address provider;
        uint256 amount;
        HostageStatus status;
    }

    mapping(bytes32 => Bond) private _bonds;

    constructor(address token_, address operator_) {
        token = IERC20(token_);
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(OPERATOR_ROLE, operator_);
    }

    function stake(bytes32 taskHash, address provider, uint256 amount) external onlyRole(OPERATOR_ROLE) nonReentrant {
        _bonds[taskHash] = Bond({provider: provider, amount: amount, status: HostageStatus.Staked});
        token.safeTransferFrom(provider, address(this), amount);
        emit HostageStaked(taskHash, provider, amount);
    }

    function refund(bytes32 taskHash) external onlyRole(OPERATOR_ROLE) nonReentrant {
        Bond storage b = _bonds[taskHash];
        if (b.status == HostageStatus.Unknown) revert UnknownTask(taskHash);
        if (b.status != HostageStatus.Staked) revert HostageAlreadyResolved(taskHash);
        b.status = HostageStatus.Refunded;
        token.safeTransfer(b.provider, b.amount);
        emit HostageRefunded(taskHash, b.provider, b.amount);
    }

    function slash(bytes32 taskHash, address recipient) external onlyRole(OPERATOR_ROLE) nonReentrant {
        require(recipient != address(0), "HostageBond: recipient is zero");
        Bond storage b = _bonds[taskHash];
        if (b.status == HostageStatus.Unknown) revert UnknownTask(taskHash);
        if (b.status != HostageStatus.Staked) revert HostageAlreadyResolved(taskHash);
        b.status = HostageStatus.Slashed;
        token.safeTransfer(recipient, b.amount);
        emit HostageSlashed(taskHash, recipient, b.amount);
    }

    function getStatus(bytes32 taskHash) external view returns (HostageStatus) {
        return _bonds[taskHash].status;
    }
}
