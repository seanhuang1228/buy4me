// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface ISelfNFT {
    // Minting function (only callable by owner)
    function mint(address to) external returns (uint256);

    // Delegate permission from one address to another
    function setDelegate(address delegate, bool allowed) external;

    // Check if an address is allowed to act for another
    function canActOnBehalf(address owner, address actor) external view returns (bool);

    // Read-only standard ERC721 functions
    function ownerOf(uint256 tokenId) external view returns (address);
    function balanceOf(address owner) external view returns (uint256);
    function name() external view returns (string memory);
    function symbol() external view returns (string memory);
}
