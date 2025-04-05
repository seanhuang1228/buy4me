import { ethers } from "hardhat";
import { hashEndpointWithScope } from "@selfxyz/core";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);
  
  const nonce = await ethers.provider.getTransactionCount(deployer.address);
  console.log("Account nonce:", nonce);
  
  const futureAddress = ethers.getCreateAddress({
    from: deployer.address,
    nonce: nonce
  });
  console.log("Calculated future contract address:", futureAddress);
  
  const Ticket = await ethers.getContractFactory("TicketSeller");

  const ticketPrice = 10;
  const maxTicketAmountCanBuy = 4;
  const selfNFT = "0x64661693E54F8B3CE0E548D4fe4FBEc3025d1236";

  console.log("Deploying Ticket...");
  const ticket = await Ticket.deploy(
    ticketPrice, 
    maxTicketAmountCanBuy, 
    selfNFT
  );
  
  await ticket.waitForDeployment();
  
  const deployedAddress = await ticket.getAddress();
  console.log("Ticket deployed to:", deployedAddress);
  
  console.log("To verify on Celoscan:");
  console.log(`npx hardhat verify --network celo ${deployedAddress} ${ticketPrice} ${maxTicketAmountCanBuy} ${selfNFT}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
