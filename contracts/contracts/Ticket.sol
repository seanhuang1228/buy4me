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
    mapping(address => uint256) public address2id;

    constructor(uint256 _ticketPrice, uint256 _maxTicketAmountCanBuy, address _selfNFT) ERC721("EventTicket", "ETKT") Ownable(msg.sender){
        ticketPrice = _ticketPrice;  // Set the ticket price on deployment
        maxTicketAmountCanBuy = _maxTicketAmountCanBuy;  // Set the maximum amount on deployment
        selfNFT = ISelfNFT(_selfNFT);  // Set the SelfNFT contract address
    }

    // Mint a ticket when paying the required amount
    function buyTicket(uint256[] calldata delegate_ids) external payable {
        uint256 totalPrice = ticketPrice * (delegate_ids.length);
        require(msg.value >= totalPrice, "Insufficient payment");
        require(delegate_ids.length <= maxTicketAmountCanBuy, "It is not allowed to buy so much ticket");

        // Check each delegate_id for the canActOnBehalf condition
        for (uint256 i = 0; i < delegate_ids.length; i++) {
            uint256 delegateId = delegate_ids[i];
            address selfNFTOwner = selfNFT.ownerOf(delegateId);
            require(selfNFT.canActOnBehalf(selfNFTOwner, msg.sender), "Delegate cannot act on your behalf");
            require(balanceOf(selfNFTOwner) == 0, "Your delegator already own a ticket");
        }

        // Check there is no duplicate delegate id in the array
        for (uint256 i = 0; i < delegate_ids.length; i++) {
            for (uint256 j = i + 1; j < delegate_ids.length; j++) {
                require(i != j, "There are duplicate delegator in your delegate_ids");
            }
        }

        // Buy ticket for your friends
        for (uint256 i = 0; i < delegate_ids.length; i++) {
            uint256 delegateId = delegate_ids[i];
            address selfNFTOwner = selfNFT.ownerOf(delegateId);
            _tokenIds++;
            _mint(selfNFTOwner, _tokenIds);
            address2id[selfNFTOwner] = _tokenIds;
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
