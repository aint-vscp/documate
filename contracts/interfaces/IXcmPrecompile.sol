// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @notice Minimal XCM interface placeholder for Solidity contracts.
/// @dev Address depends on the target parachain runtime configuration.
interface IXcmPrecompile {
    function transferMultiasset(
        bytes calldata destination,
        bytes calldata beneficiary,
        bytes calldata assets,
        uint64 feeAssetItem
    ) external payable;
}
