// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/ISelfNFT.sol";

contract TicketSeller is ERC721, Ownable {
    uint256 private _tokenIds;
    uint256 public ticketPrice;  // Price of one ticket in Celo
    uint256 public maxTicketAmountCanBuy;  // The maximum amount of ticket an user can buy
    ISelfNFT public selfNFT;  // SelfNFT contract reference

    constructor(uint256 _ticketPrice, uint256 _maxTicketAmountCanBuy, address _selfNFT) ERC721("EventTicket", "ETKT") Ownable(msg.sender){
        ticketPrice = _ticketPrice;  // Set the ticket price on deployment
        maxTicketAmountCanBuy = _maxTicketAmountCanBuy;  // Set the maximum amount on deployment
        selfNFT = ISelfNFT(_selfNFT);  // Set the SelfNFT contract address
    }

    // Mint a ticket when paying the required amount
    function buyTicket(uint256[] calldata delegate_ids) external payable {
        uint256 totalPrice = ticketPrice * (1 + delegate_ids.length);
        require(msg.value >= totalPrice, "Insufficient payment");
        require(delegate_ids.length <= maxTicketAmountCanBuy - 1, "It is not allowed to buy so much ticket");
        require(selfNFT.balanceOf(msg.sender) > 0, "You must own a SelfNFT to buy a ticket");
        require(balanceOf(msg.sender) == 0, "You already own a ticket");

        // Check each delegate_id for the canActOnBehalf condition
        for (uint256 i = 0; i < delegate_ids.length; i++) {
            uint256 delegateId = delegate_ids[i];
            address selfNFTOwner = selfNFT.ownerOf(delegateId);
            require(selfNFT.canActOnBehalf(selfNFTOwner, msg.sender), "Delegate cannot act on your behalf");
            require(balanceOf(selfNFTOwner) == 0, "Your delegator already own a ticket");
        }

        // Increment the tokenId to ensure unique tickets
        _tokenIds++;

        // Mint the NFT (ticket) for the buyer
        _mint(msg.sender, _tokenIds);
        
        // Buy ticket for your friends
        for (uint256 i = 0; i < delegate_ids.length; i++) {
            uint256 delegateId = delegate_ids[i];
            address selfNFTOwner = selfNFT.ownerOf(delegateId);
            _tokenIds++;
            _mint(selfNFTOwner, _tokenIds);
        }

        // Refund any excess payment if the user sends more than required
        if (msg.value > totalPrice) {
            payable(msg.sender).transfer(msg.value - totalPrice);
        }
    }

    // Set the ticket price (only the owner can do this)
    function setTicketPrice(uint256 _newPrice) external onlyOwner {
        ticketPrice = _newPrice;
    }

    // Withdraw the funds collected (only the owner can do this)
    function withdraw() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }

    // Get the contract balance (for transparency)
    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }
}
