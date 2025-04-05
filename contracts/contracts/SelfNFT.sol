// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract SelfNFT is ERC721, Ownable {
    uint256 private _tokenIds;

    // delegationMap[B][A] = true means A can act for B
    mapping(address => mapping(address => bool)) public delegationMap;
    mapping(address => uint256) public address2id;

    constructor() ERC721("SelfNFT", "SNFT") Ownable(msg.sender) {}

    // Mint function for demonstration
    function mint(address to) external onlyOwner returns (uint256) {
        _tokenIds++;
        _mint(to, _tokenIds);
        address2id[to] = _tokenIds;
        return _tokenIds;
    }

    // Prevent all transfers
    function transferFrom(address from, address to, uint256 tokenId) public virtual override {
        revert("Transfers are disabled");
    }

    function safeTransferFrom(address from, address to, uint256 tokenId, bytes memory data) public virtual override {
        revert("Transfers are disabled");
    }

    // Disable low-level update logic to prevent transfers via _update
    function _update(address to, uint256 tokenId, address auth)
        internal
        override
        returns (address)
    {
        address from = _ownerOf(tokenId);

        // Allow only mint (from == address(0)) and burn (to == address(0))
        if (from != address(0) && to != address(0)) {
            revert("Transfers are disabled");
        }

        return super._update(to, tokenId, auth);
    }

    function approve(address to, uint256 tokenId) public virtual override {
        revert("Approvals are disabled");
    }

    function setApprovalForAll(address operator, bool approved) public virtual override {
        revert("Approvals are disabled");
    }

    // Set delegation permission
    function toggleDelegate(address delegate) external {
        bool newStatus = !delegationMap[msg.sender][delegate];
        delegationMap[msg.sender][delegate] = newStatus;
    }

    // Check if A is allowed to act for B
    function canActOnBehalf(address owner, address actor) external view returns (bool) {
        if (owner == actor) {
            return true
        }
        return delegationMap[owner][actor];
    }
}
