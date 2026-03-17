// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @notice Minimal identity precompile view interface.
/// @dev On Moonbeam-family chains this is available at 0x000...0818.
interface IIdentityPrecompile {
    struct Registration {
        bool isValid;
    }

    function identity(address who) external view returns (Registration memory);
}
