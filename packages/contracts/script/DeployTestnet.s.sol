// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.27;

import {Script, console} from "forge-std/Script.sol";
import {EscrowVault} from "../src/EscrowVault.sol";
import {HostageBond} from "../src/HostageBond.sol";
import {ServiceMarketplace} from "../src/ServiceMarketplace.sol";

/// @notice Deploy script for Plasma testnet (Sprint 3 will exercise this against the real RPC).
/// Required env: USDT_ADDRESS (token to use), ADMIN_ADDRESS (Safe multisig for DEFAULT_ADMIN_ROLE).
contract DeployTestnet is Script {
    function run() external {
        address usdt = vm.envAddress("USDT_ADDRESS");
        address admin = vm.envAddress("ADMIN_ADDRESS");

        vm.startBroadcast();

        // 1) Deploy leaf contracts with deployer as the initial operator placeholder.
        EscrowVault escrow = new EscrowVault(usdt, address(this));
        HostageBond bond = new HostageBond(usdt, address(this));

        // 2) Deploy orchestrator with admin as DEFAULT_ADMIN_ROLE + ADMIN_ROLE holder.
        ServiceMarketplace marketplace = new ServiceMarketplace(address(escrow), address(bond), admin);

        // 3) Transfer OPERATOR_ROLE on both leaves to the marketplace.
        escrow.grantRole(escrow.OPERATOR_ROLE(), address(marketplace));
        bond.grantRole(bond.OPERATOR_ROLE(), address(marketplace));

        // 4) Revoke the deployer's placeholder OPERATOR_ROLE so the marketplace is the sole operator.
        escrow.revokeRole(escrow.OPERATOR_ROLE(), address(this));
        bond.revokeRole(bond.OPERATOR_ROLE(), address(this));

        // 5) Transfer DEFAULT_ADMIN_ROLE on both leaves to the admin Safe.
        escrow.grantRole(escrow.DEFAULT_ADMIN_ROLE(), admin);
        bond.grantRole(bond.DEFAULT_ADMIN_ROLE(), admin);
        escrow.renounceRole(escrow.DEFAULT_ADMIN_ROLE(), address(this));
        bond.renounceRole(bond.DEFAULT_ADMIN_ROLE(), address(this));

        vm.stopBroadcast();

        console.log("EscrowVault:        ", address(escrow));
        console.log("HostageBond:        ", address(bond));
        console.log("ServiceMarketplace: ", address(marketplace));
    }
}
