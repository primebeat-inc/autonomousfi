// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.27;

import {Test} from "forge-std/Test.sol";
import {MockERC20} from "./MockERC20.sol";

contract MockERC20Test is Test {
    MockERC20 token;
    address alice = address(0xA11CE);

    function setUp() public {
        token = new MockERC20("USDT Test", "USDT", 6);
    }

    function test_mintAndBalanceOf() public {
        token.mint(alice, 1_000_000);
        assertEq(token.balanceOf(alice), 1_000_000);
    }

    function test_transferFromWithApproval() public {
        token.mint(alice, 1_000);
        vm.prank(alice);
        token.approve(address(this), 500);
        token.transferFrom(alice, address(this), 500);
        assertEq(token.balanceOf(alice), 500);
        assertEq(token.balanceOf(address(this)), 500);
    }
}
