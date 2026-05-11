// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.27;

import {Test} from "forge-std/Test.sol";
import {EscrowVault} from "../src/EscrowVault.sol";
import {IEscrowVault} from "../src/interfaces/IEscrowVault.sol";
import {MockERC20} from "./mocks/MockERC20.sol";

contract EscrowVaultTest is Test {
    EscrowVault vault;
    MockERC20 token;
    address operator = address(0x0BBE);
    address requester = address(0xA11CE);
    address provider = address(0xB0B);
    bytes32 constant TASK = bytes32(uint256(0xfeedface));

    function setUp() public {
        token = new MockERC20("USDT", "USDT", 6);
        vault = new EscrowVault(address(token), operator);
        token.mint(requester, 10_000);
        vm.prank(requester);
        token.approve(address(vault), type(uint256).max);
    }

    function _lock(uint256 amount, uint256 deadline) internal {
        vm.prank(operator);
        vault.lock(requester, provider, TASK, amount, deadline);
    }

    function test_lockDebitsRequesterCreditsVault() public {
        _lock(1_000, block.timestamp + 1 hours);
        assertEq(token.balanceOf(requester), 9_000);
        assertEq(token.balanceOf(address(vault)), 1_000);
        assertEq(uint8(vault.getStatus(TASK)), uint8(IEscrowVault.EscrowStatus.Locked));
    }

    function test_releasePaysProvider() public {
        _lock(1_000, block.timestamp + 1 hours);
        vm.prank(operator);
        vault.release(TASK);
        assertEq(token.balanceOf(provider), 1_000);
        assertEq(uint8(vault.getStatus(TASK)), uint8(IEscrowVault.EscrowStatus.Released));
    }

    function test_refundAfterDeadlinePermissionless() public {
        _lock(1_000, block.timestamp + 1 hours);
        vm.warp(block.timestamp + 2 hours);
        vault.refund(TASK);
        assertEq(token.balanceOf(requester), 10_000);
        assertEq(uint8(vault.getStatus(TASK)), uint8(IEscrowVault.EscrowStatus.Refunded));
    }

    function test_refundBeforeDeadlineReverts() public {
        _lock(1_000, block.timestamp + 1 hours);
        vm.expectRevert(abi.encodeWithSelector(IEscrowVault.DeadlineNotReached.selector, block.timestamp + 1 hours, block.timestamp));
        vault.refund(TASK);
    }

    function test_doubleReleaseReverts() public {
        _lock(1_000, block.timestamp + 1 hours);
        vm.startPrank(operator);
        vault.release(TASK);
        vm.expectRevert(abi.encodeWithSelector(IEscrowVault.AlreadyReleased.selector, TASK));
        vault.release(TASK);
        vm.stopPrank();
    }

    function test_refundOfReleasedReverts() public {
        _lock(1_000, block.timestamp + 1 hours);
        vm.prank(operator);
        vault.release(TASK);
        vm.warp(block.timestamp + 2 hours);
        vm.expectRevert(abi.encodeWithSelector(IEscrowVault.AlreadyReleased.selector, TASK));
        vault.refund(TASK);
    }

    function test_releaseUnknownReverts() public {
        bytes32 other = bytes32(uint256(0xdeadbeef));
        vm.prank(operator);
        vm.expectRevert(abi.encodeWithSelector(IEscrowVault.UnknownTask.selector, other));
        vault.release(other);
    }

    function test_nonOperatorCannotLock() public {
        vm.expectRevert();
        vm.prank(address(0xdead));
        vault.lock(requester, provider, TASK, 100, block.timestamp + 1 hours);
    }

    function test_nonOperatorCannotRelease() public {
        _lock(1_000, block.timestamp + 1 hours);
        vm.expectRevert();
        vm.prank(address(0xdead));
        vault.release(TASK);
    }

    function test_doubleRefundReverts() public {
        _lock(1_000, block.timestamp + 1 hours);
        vm.warp(block.timestamp + 2 hours);
        vault.refund(TASK);
        vm.expectRevert(abi.encodeWithSelector(IEscrowVault.AlreadyRefunded.selector, TASK));
        vault.refund(TASK);
    }

    function test_releaseOfRefundedReverts() public {
        _lock(1_000, block.timestamp + 1 hours);
        vm.warp(block.timestamp + 2 hours);
        vault.refund(TASK);
        vm.prank(operator);
        vm.expectRevert(abi.encodeWithSelector(IEscrowVault.AlreadyRefunded.selector, TASK));
        vault.release(TASK);
    }

    function test_refundUnknownReverts() public {
        bytes32 other = bytes32(uint256(0xfacefeed));
        vm.expectRevert(abi.encodeWithSelector(IEscrowVault.UnknownTask.selector, other));
        vault.refund(other);
    }
}

contract EscrowVaultFuzzTest is Test {
    EscrowVault vault;
    MockERC20 token;
    address operator = address(0x0BBE);

    function setUp() public {
        token = new MockERC20("USDT", "USDT", 6);
        vault = new EscrowVault(address(token), operator);
    }

    function testFuzz_lockAndReleaseIsBalancePreserving(
        address requester,
        address provider,
        bytes32 taskHash,
        uint256 amount,
        uint256 deadline
    ) public {
        vm.assume(requester != address(0) && provider != address(0) && requester != provider);
        vm.assume(requester != address(vault) && provider != address(vault));
        vm.assume(amount > 0 && amount < type(uint128).max);
        vm.assume(deadline > block.timestamp && deadline < type(uint64).max);

        token.mint(requester, amount);
        vm.prank(requester);
        token.approve(address(vault), amount);

        uint256 totalBefore = token.balanceOf(requester) + token.balanceOf(provider);
        vm.prank(operator);
        vault.lock(requester, provider, taskHash, amount, deadline);
        vm.prank(operator);
        vault.release(taskHash);

        uint256 totalAfter = token.balanceOf(requester) + token.balanceOf(provider);
        assertEq(totalAfter, totalBefore);
        assertEq(token.balanceOf(provider), amount);
    }

    function testFuzz_lockAndRefundIsBalancePreserving(
        address requester,
        address provider,
        bytes32 taskHash,
        uint256 amount,
        uint256 deadline
    ) public {
        vm.assume(requester != address(0) && provider != address(0) && requester != provider);
        vm.assume(requester != address(vault) && provider != address(vault));
        vm.assume(amount > 0 && amount < type(uint128).max);
        vm.assume(deadline > block.timestamp && deadline < block.timestamp + 365 days);

        token.mint(requester, amount);
        vm.prank(requester);
        token.approve(address(vault), amount);

        uint256 reqBefore = token.balanceOf(requester);
        vm.prank(operator);
        vault.lock(requester, provider, taskHash, amount, deadline);
        vm.warp(deadline + 1);
        vault.refund(taskHash);

        assertEq(token.balanceOf(requester), reqBefore);
        assertEq(token.balanceOf(provider), 0);
    }
}
