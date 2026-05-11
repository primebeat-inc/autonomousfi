// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.27;

import {Test} from "forge-std/Test.sol";
import {ServiceMarketplace} from "../src/ServiceMarketplace.sol";
import {IServiceMarketplace} from "../src/interfaces/IServiceMarketplace.sol";
import {EscrowVault} from "../src/EscrowVault.sol";
import {HostageBond} from "../src/HostageBond.sol";
import {MockERC20} from "./mocks/MockERC20.sol";

contract ServiceMarketplaceTest is Test {
    ServiceMarketplace marketplace;
    EscrowVault escrow;
    HostageBond bond;
    MockERC20 token;

    address admin = address(0xAD);
    address requester = address(0xA11CE);
    address provider = address(0xB0B);
    bytes32 constant TASK = bytes32(uint256(0xfeedface));
    bytes32 constant QHASH = bytes32(uint256(0xa55));
    bytes32 constant RHASH = bytes32(uint256(0xfeed));

    function setUp() public {
        token = new MockERC20("USDT", "USDT", 6);
        // Deploy leaf contracts with self as operator placeholder, then transfer operator to marketplace
        escrow = new EscrowVault(address(token), address(this));
        bond = new HostageBond(address(token), address(this));
        marketplace = new ServiceMarketplace(address(escrow), address(bond), admin);
        // Marketplace becomes operator on both leaves
        escrow.grantRole(escrow.OPERATOR_ROLE(), address(marketplace));
        bond.grantRole(bond.OPERATOR_ROLE(), address(marketplace));

        token.mint(requester, 10_000);
        token.mint(provider, 10_000);
        vm.prank(requester);
        token.approve(address(escrow), type(uint256).max);
        vm.prank(provider);
        token.approve(address(bond), type(uint256).max);
    }

    function _create() internal {
        vm.prank(requester);
        marketplace.createTask(provider, TASK, 100, 50, QHASH, block.timestamp + 1 days);
    }

    // Happy path

    function test_createTaskLocksEscrowAndStakesHostage() public {
        _create();
        assertEq(token.balanceOf(requester), 9_900);
        assertEq(token.balanceOf(provider), 9_950);
        assertEq(token.balanceOf(address(escrow)), 100);
        assertEq(token.balanceOf(address(bond)), 50);
        assertEq(uint8(marketplace.getStatus(TASK)), uint8(IServiceMarketplace.TaskStatus.Created));
    }

    function test_submitResultByProvider() public {
        _create();
        vm.prank(provider);
        marketplace.submitResult(TASK, RHASH);
        assertEq(uint8(marketplace.getStatus(TASK)), uint8(IServiceMarketplace.TaskStatus.Submitted));
    }

    function test_settleByRequesterPaysProvider() public {
        _create();
        vm.prank(provider);
        marketplace.submitResult(TASK, RHASH);
        vm.prank(requester);
        marketplace.settle(TASK);
        // requester paid 100 (still 9_900), provider gained 100 from escrow + 50 stake refunded back to original = 10_000+100=10_050 minus initial 50 stake = 10_050? Let's compute:
        // Before settle: requester 9_900, provider 9_950 (after stake debit), escrow 100, bond 50
        // After settle: escrow releases 100 to provider -> provider 10_050. bond refunds 50 to provider -> provider 10_100.
        assertEq(token.balanceOf(requester), 9_900);
        assertEq(token.balanceOf(provider), 10_100);
        assertEq(uint8(marketplace.getStatus(TASK)), uint8(IServiceMarketplace.TaskStatus.Settled));
    }

    function test_disputeMarksDisputed() public {
        _create();
        vm.prank(provider);
        marketplace.submitResult(TASK, RHASH);
        vm.prank(requester);
        marketplace.dispute(TASK, "bad output");
        assertEq(uint8(marketplace.getStatus(TASK)), uint8(IServiceMarketplace.TaskStatus.Disputed));
    }

    function test_resolveDisputeInFavorOfRequester() public {
        _create();
        vm.prank(provider);
        marketplace.submitResult(TASK, RHASH);
        vm.prank(requester);
        marketplace.dispute(TASK, "bad output");
        vm.prank(admin);
        marketplace.resolveDispute(TASK, true);
        // requester refunded 100 + slashed stake 50 = 10_000+50 = 10_050
        assertEq(token.balanceOf(requester), 10_050);
        // provider lost the stake
        assertEq(token.balanceOf(provider), 9_950);
        assertEq(uint8(marketplace.getStatus(TASK)), uint8(IServiceMarketplace.TaskStatus.Slashed));
    }

    function test_resolveDisputeInFavorOfProvider() public {
        _create();
        vm.prank(provider);
        marketplace.submitResult(TASK, RHASH);
        vm.prank(requester);
        marketplace.dispute(TASK, "bad output");
        vm.prank(admin);
        marketplace.resolveDispute(TASK, false);
        // Same as settle: provider gets 100 + 50 back = 10_100
        assertEq(token.balanceOf(provider), 10_100);
        assertEq(uint8(marketplace.getStatus(TASK)), uint8(IServiceMarketplace.TaskStatus.Settled));
    }

    // Error paths

    function test_createTaskDuplicateReverts() public {
        _create();
        vm.prank(requester);
        vm.expectRevert(abi.encodeWithSelector(ServiceMarketplace.TaskAlreadyExists.selector, TASK));
        marketplace.createTask(provider, TASK, 100, 50, QHASH, block.timestamp + 1 days);
    }

    function test_createTaskSelfDealingReverts() public {
        vm.prank(requester);
        vm.expectRevert(abi.encodeWithSelector(ServiceMarketplace.SelfDealing.selector, requester));
        marketplace.createTask(requester, TASK, 100, 50, QHASH, block.timestamp + 1 days);
    }

    function test_createTaskZeroPriceReverts() public {
        vm.prank(requester);
        vm.expectRevert(ServiceMarketplace.ZeroAmount.selector);
        marketplace.createTask(provider, TASK, 0, 50, QHASH, block.timestamp + 1 days);
    }

    function test_createTaskZeroStakeReverts() public {
        vm.prank(requester);
        vm.expectRevert(ServiceMarketplace.ZeroAmount.selector);
        marketplace.createTask(provider, TASK, 100, 0, QHASH, block.timestamp + 1 days);
    }

    function test_submitResultNotProviderReverts() public {
        _create();
        vm.prank(address(0xdead));
        vm.expectRevert(abi.encodeWithSelector(IServiceMarketplace.NotProvider.selector, TASK, address(0xdead), provider));
        marketplace.submitResult(TASK, RHASH);
    }

    function test_submitResultWrongStatusReverts() public {
        _create();
        vm.startPrank(provider);
        marketplace.submitResult(TASK, RHASH);
        vm.expectRevert(
            abi.encodeWithSelector(
                IServiceMarketplace.WrongTaskStatus.selector,
                TASK,
                IServiceMarketplace.TaskStatus.Created,
                IServiceMarketplace.TaskStatus.Submitted
            )
        );
        marketplace.submitResult(TASK, RHASH);
        vm.stopPrank();
    }

    function test_settleNotRequesterReverts() public {
        _create();
        vm.prank(provider);
        marketplace.submitResult(TASK, RHASH);
        vm.prank(address(0xdead));
        vm.expectRevert(abi.encodeWithSelector(IServiceMarketplace.NotRequester.selector, TASK, address(0xdead), requester));
        marketplace.settle(TASK);
    }

    function test_settleWrongStatusReverts() public {
        _create();
        vm.prank(requester);
        vm.expectRevert(
            abi.encodeWithSelector(
                IServiceMarketplace.WrongTaskStatus.selector,
                TASK,
                IServiceMarketplace.TaskStatus.Submitted,
                IServiceMarketplace.TaskStatus.Created
            )
        );
        marketplace.settle(TASK);
    }

    function test_disputeNotRequesterReverts() public {
        _create();
        vm.prank(provider);
        marketplace.submitResult(TASK, RHASH);
        vm.prank(address(0xdead));
        vm.expectRevert(abi.encodeWithSelector(IServiceMarketplace.NotRequester.selector, TASK, address(0xdead), requester));
        marketplace.dispute(TASK, "x");
    }

    function test_resolveDisputeNonAdminReverts() public {
        _create();
        vm.prank(provider);
        marketplace.submitResult(TASK, RHASH);
        vm.prank(requester);
        marketplace.dispute(TASK, "x");
        vm.prank(address(0xdead));
        vm.expectRevert();
        marketplace.resolveDispute(TASK, true);
    }

    function test_resolveDisputeWrongStatusReverts() public {
        _create();
        vm.prank(admin);
        vm.expectRevert(
            abi.encodeWithSelector(
                IServiceMarketplace.WrongTaskStatus.selector,
                TASK,
                IServiceMarketplace.TaskStatus.Disputed,
                IServiceMarketplace.TaskStatus.Created
            )
        );
        marketplace.resolveDispute(TASK, true);
    }

    function test_constructorRejectsZeroAdmin() public {
        vm.expectRevert(ServiceMarketplace.ZeroRecipient.selector);
        new ServiceMarketplace(address(escrow), address(bond), address(0));
    }

    function test_getStatusUnknownReturnsUnknown() public view {
        bytes32 other = bytes32(uint256(0x12345));
        assertEq(uint8(marketplace.getStatus(other)), uint8(IServiceMarketplace.TaskStatus.Unknown));
    }
}
