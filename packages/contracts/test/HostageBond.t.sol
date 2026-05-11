// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.27;

import {Test} from "forge-std/Test.sol";
import {HostageBond} from "../src/HostageBond.sol";
import {IHostageBond} from "../src/interfaces/IHostageBond.sol";
import {MockERC20} from "./mocks/MockERC20.sol";

contract HostageBondTest is Test {
    HostageBond bond;
    MockERC20 token;
    address operator = address(0x0BBE);
    address provider = address(0xB0B);
    address recipient = address(0xA11CE);
    bytes32 constant TASK = bytes32(uint256(0xfeedface));

    function setUp() public {
        token = new MockERC20("USDT", "USDT", 6);
        bond = new HostageBond(address(token), operator);
        token.mint(provider, 10_000);
        vm.prank(provider);
        token.approve(address(bond), type(uint256).max);
    }

    function _stake(uint256 amount) internal {
        vm.prank(operator);
        bond.stake(TASK, provider, amount);
    }

    function test_stakeDebitsProviderCreditsBond() public {
        _stake(500);
        assertEq(token.balanceOf(provider), 9_500);
        assertEq(token.balanceOf(address(bond)), 500);
        assertEq(uint8(bond.getStatus(TASK)), uint8(IHostageBond.HostageStatus.Staked));
    }

    function test_refundReturnsStakeToProvider() public {
        _stake(500);
        vm.prank(operator);
        bond.refund(TASK);
        assertEq(token.balanceOf(provider), 10_000);
        assertEq(uint8(bond.getStatus(TASK)), uint8(IHostageBond.HostageStatus.Refunded));
    }

    function test_slashSendsStakeToRecipient() public {
        _stake(500);
        vm.prank(operator);
        bond.slash(TASK, recipient);
        assertEq(token.balanceOf(recipient), 500);
        assertEq(uint8(bond.getStatus(TASK)), uint8(IHostageBond.HostageStatus.Slashed));
    }

    function test_doubleRefundReverts() public {
        _stake(500);
        vm.startPrank(operator);
        bond.refund(TASK);
        vm.expectRevert(abi.encodeWithSelector(IHostageBond.HostageAlreadyResolved.selector, TASK));
        bond.refund(TASK);
        vm.stopPrank();
    }

    function test_slashAfterRefundReverts() public {
        _stake(500);
        vm.startPrank(operator);
        bond.refund(TASK);
        vm.expectRevert(abi.encodeWithSelector(IHostageBond.HostageAlreadyResolved.selector, TASK));
        bond.slash(TASK, recipient);
        vm.stopPrank();
    }

    function test_doubleSlashReverts() public {
        _stake(500);
        vm.startPrank(operator);
        bond.slash(TASK, recipient);
        vm.expectRevert(abi.encodeWithSelector(IHostageBond.HostageAlreadyResolved.selector, TASK));
        bond.slash(TASK, recipient);
        vm.stopPrank();
    }

    function test_refundAfterSlashReverts() public {
        _stake(500);
        vm.startPrank(operator);
        bond.slash(TASK, recipient);
        vm.expectRevert(abi.encodeWithSelector(IHostageBond.HostageAlreadyResolved.selector, TASK));
        bond.refund(TASK);
        vm.stopPrank();
    }

    function test_refundUnknownReverts() public {
        bytes32 other = bytes32(uint256(0xdeadbeef));
        vm.prank(operator);
        vm.expectRevert(abi.encodeWithSelector(IHostageBond.UnknownTask.selector, other));
        bond.refund(other);
    }

    function test_slashUnknownReverts() public {
        bytes32 other = bytes32(uint256(0xdeadbeef));
        vm.prank(operator);
        vm.expectRevert(abi.encodeWithSelector(IHostageBond.UnknownTask.selector, other));
        bond.slash(other, recipient);
    }

    function test_nonOperatorCannotStake() public {
        vm.expectRevert();
        vm.prank(address(0xdead));
        bond.stake(TASK, provider, 100);
    }

    function test_nonOperatorCannotRefund() public {
        _stake(500);
        vm.expectRevert();
        vm.prank(address(0xdead));
        bond.refund(TASK);
    }

    function test_nonOperatorCannotSlash() public {
        _stake(500);
        vm.expectRevert();
        vm.prank(address(0xdead));
        bond.slash(TASK, recipient);
    }

    function test_slashZeroRecipientReverts() public {
        _stake(500);
        vm.prank(operator);
        vm.expectRevert(bytes("HostageBond: recipient is zero"));
        bond.slash(TASK, address(0));
    }
}

contract HostageBondFuzzTest is Test {
    HostageBond bond;
    MockERC20 token;
    address operator = address(0x0BBE);

    function setUp() public {
        token = new MockERC20("USDT", "USDT", 6);
        bond = new HostageBond(address(token), operator);
    }

    function testFuzz_stakeAndRefundIsBalancePreserving(
        address provider,
        bytes32 taskHash,
        uint256 amount
    ) public {
        vm.assume(provider != address(0) && provider != address(bond));
        vm.assume(amount > 0 && amount < type(uint128).max);
        token.mint(provider, amount);
        vm.prank(provider);
        token.approve(address(bond), amount);
        uint256 before_ = token.balanceOf(provider);
        vm.prank(operator);
        bond.stake(taskHash, provider, amount);
        vm.prank(operator);
        bond.refund(taskHash);
        assertEq(token.balanceOf(provider), before_);
    }

    function testFuzz_stakeAndSlashIsBalancePreserving(
        address provider,
        address recipient,
        bytes32 taskHash,
        uint256 amount
    ) public {
        vm.assume(provider != address(0) && recipient != address(0) && provider != recipient);
        vm.assume(provider != address(bond) && recipient != address(bond));
        vm.assume(amount > 0 && amount < type(uint128).max);
        token.mint(provider, amount);
        vm.prank(provider);
        token.approve(address(bond), amount);
        vm.prank(operator);
        bond.stake(taskHash, provider, amount);
        vm.prank(operator);
        bond.slash(taskHash, recipient);
        assertEq(token.balanceOf(recipient), amount);
        assertEq(token.balanceOf(provider), 0);
    }
}
