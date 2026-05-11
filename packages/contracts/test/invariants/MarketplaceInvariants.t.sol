// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.27;

import {Test, StdInvariant} from "forge-std/Test.sol";
import {ServiceMarketplace} from "../../src/ServiceMarketplace.sol";
import {EscrowVault} from "../../src/EscrowVault.sol";
import {HostageBond} from "../../src/HostageBond.sol";
import {IServiceMarketplace} from "../../src/interfaces/IServiceMarketplace.sol";
import {MockERC20} from "../mocks/MockERC20.sol";

/// @dev Fuzz handler that exercises ServiceMarketplace through random sequences
/// of create / submit / settle / dispute / resolve. Holds counters that
/// the invariant test can read to assert structural properties.
contract MarketplaceHandler is Test {
    ServiceMarketplace public marketplace;
    EscrowVault public escrow;
    HostageBond public bond;
    MockERC20 public token;

    address[3] public actors;
    bytes32[] public createdTasks;
    bytes32[] public submittedTasks;
    bytes32[] public disputedTasks;
    uint256 public settleCount;
    uint256 public slashCount;
    uint256 public createdCount;

    constructor(
        ServiceMarketplace marketplace_,
        EscrowVault escrow_,
        HostageBond bond_,
        MockERC20 token_,
        address[3] memory actors_
    ) {
        marketplace = marketplace_;
        escrow = escrow_;
        bond = bond_;
        token = token_;
        actors = actors_;
    }

    function createTask(uint8 reqIdx, uint8 provIdx, uint96 priceSeed, uint96 stakeSeed, uint256 hashSeed) external {
        address requester = actors[reqIdx % 3];
        address provider = actors[provIdx % 3];
        if (requester == provider) return;
        uint256 price = (uint256(priceSeed) % 100) + 1; // 1..100
        uint256 stake = (uint256(stakeSeed) % 100) + 1;
        if (token.balanceOf(requester) < price) return;
        if (token.balanceOf(provider) < stake) return;
        bytes32 taskHash = keccak256(abi.encodePacked(hashSeed, createdTasks.length, block.number));
        // Already-exists guard
        if (marketplace.getStatus(taskHash) != IServiceMarketplace.TaskStatus.Unknown) return;

        vm.prank(requester);
        try marketplace.createTask(provider, taskHash, price, stake, bytes32(0), block.timestamp + 1 days) {
            createdTasks.push(taskHash);
            createdCount += 1;
        } catch {}
    }

    function submitResult(uint256 idxSeed, bytes32 resultHash) external {
        if (createdTasks.length == 0) return;
        bytes32 taskHash = createdTasks[idxSeed % createdTasks.length];
        if (marketplace.getStatus(taskHash) != IServiceMarketplace.TaskStatus.Created) return;
        ServiceMarketplace.Task memory t = marketplace.getTask(taskHash);
        vm.prank(t.provider);
        try marketplace.submitResult(taskHash, resultHash) {
            submittedTasks.push(taskHash);
        } catch {}
    }

    function settle(uint256 idxSeed) external {
        if (submittedTasks.length == 0) return;
        bytes32 taskHash = submittedTasks[idxSeed % submittedTasks.length];
        if (marketplace.getStatus(taskHash) != IServiceMarketplace.TaskStatus.Submitted) return;
        ServiceMarketplace.Task memory t = marketplace.getTask(taskHash);
        vm.prank(t.requester);
        try marketplace.settle(taskHash) {
            settleCount += 1;
        } catch {}
    }

    function dispute(uint256 idxSeed) external {
        if (submittedTasks.length == 0) return;
        bytes32 taskHash = submittedTasks[idxSeed % submittedTasks.length];
        if (marketplace.getStatus(taskHash) != IServiceMarketplace.TaskStatus.Submitted) return;
        ServiceMarketplace.Task memory t = marketplace.getTask(taskHash);
        vm.prank(t.requester);
        try marketplace.dispute(taskHash, "fuzz") {
            disputedTasks.push(taskHash);
        } catch {}
    }

    function resolveDispute(uint256 idxSeed, bool inFavorOfRequester, address admin) external {
        if (disputedTasks.length == 0) return;
        bytes32 taskHash = disputedTasks[idxSeed % disputedTasks.length];
        if (marketplace.getStatus(taskHash) != IServiceMarketplace.TaskStatus.Disputed) return;
        vm.prank(admin);
        try marketplace.resolveDispute(taskHash, inFavorOfRequester) {
            if (inFavorOfRequester) slashCount += 1;
            else settleCount += 1;
        } catch {}
    }
}

contract MarketplaceInvariantsTest is StdInvariant, Test {
    ServiceMarketplace marketplace;
    EscrowVault escrow;
    HostageBond bond;
    MockERC20 token;
    MarketplaceHandler handler;

    address constant ALICE = address(0xA11CE);
    address constant BOB = address(0xB0B);
    address constant CARA = address(0xCA1);
    address constant ADMIN = address(0xAD);
    uint256 constant ACTOR_INITIAL = 100_000;

    function setUp() public {
        token = new MockERC20("USDT", "USDT", 6);
        escrow = new EscrowVault(address(token), address(this));
        bond = new HostageBond(address(token), address(this));
        marketplace = new ServiceMarketplace(address(escrow), address(bond), ADMIN);
        escrow.grantRole(escrow.OPERATOR_ROLE(), address(marketplace));
        bond.grantRole(bond.OPERATOR_ROLE(), address(marketplace));

        // FIXED SUPPLY for I1 conservation: mint once, never again.
        token.mint(ALICE, ACTOR_INITIAL);
        token.mint(BOB, ACTOR_INITIAL);
        token.mint(CARA, ACTOR_INITIAL);
        // Pre-approve all actors against both leaf contracts.
        for (uint i = 0; i < 3; i++) {
            address a = [ALICE, BOB, CARA][i];
            vm.prank(a);
            token.approve(address(escrow), type(uint256).max);
            vm.prank(a);
            token.approve(address(bond), type(uint256).max);
        }

        handler = new MarketplaceHandler(marketplace, escrow, bond, token, [ALICE, BOB, CARA]);
        targetContract(address(handler));

        // Restrict to handler entry points (not internal Test helpers).
        bytes4[] memory selectors = new bytes4[](5);
        selectors[0] = MarketplaceHandler.createTask.selector;
        selectors[1] = MarketplaceHandler.submitResult.selector;
        selectors[2] = MarketplaceHandler.settle.selector;
        selectors[3] = MarketplaceHandler.dispute.selector;
        selectors[4] = MarketplaceHandler.resolveDispute.selector;
        targetSelector(FuzzSelector({addr: address(handler), selectors: selectors}));
    }

    /// I1 (funds conservation): total token balance across actors and protocol
    /// contracts is constant for any sequence of legal operations.
    function invariant_fundsAreConserved() public view {
        uint256 systemBalance = token.balanceOf(address(escrow))
                              + token.balanceOf(address(bond))
                              + token.balanceOf(ALICE)
                              + token.balanceOf(BOB)
                              + token.balanceOf(CARA);
        assertEq(systemBalance, 3 * ACTOR_INITIAL);
    }

    /// I2 (no double resolve): every resolved (settled or slashed) task counts
    /// at most once toward the resolve totals. Equivalently, settle + slash count
    /// never exceeds tasks created.
    function invariant_noDoubleResolve() public view {
        assertLe(handler.settleCount() + handler.slashCount(), handler.createdCount());
    }

    /// I3 (status monotonicity): no created task is in the Unknown state
    /// (status only advances, never resets).
    function invariant_statusMonotonicity() public view {
        uint256 n = handler.createdCount();
        if (n == 0) return;
        // Sample first 16 tasks (or all, if fewer) to keep gas bounded.
        uint256 sampleSize = n > 16 ? 16 : n;
        for (uint256 i = 0; i < sampleSize; i++) {
            // Read handler.createdTasks(i) via the array getter generated by Solidity.
            bytes32 taskHash = handler.createdTasks(i);
            assertGt(uint8(marketplace.getStatus(taskHash)), uint8(IServiceMarketplace.TaskStatus.Unknown));
        }
    }
}
