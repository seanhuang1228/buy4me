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
  
  // For prod environment
  // const identityVerificationHub = "0x9AcA2112D34Ef021084264F6f5eef2a99a5bA7b1";
  // For staging environment
  const identityVerificationHub = "0x3e2487a250e2A7b56c7ef5307Fb591Cc8C83623D";

  const scope = hashEndpointWithScope("https://1303-140-112-16-175.ngrok-free.app", 'self-auth');
  const attestationId = 1n;

  // For mainnet environment
  // const token = "0xcebA9300f2b948710d2653dD7B07f33A8B32118C";
  // For staging environment
  const token = "0x2F25deB3848C207fc8E0c34035B3Ba7fC157602B";

  const olderThanEnabled = false;
  const olderThan = 18n;
  const forbiddenCountriesEnabled = false;
  const forbiddenCountriesListPacked = [0n, 0n, 0n, 0n] as [bigint, bigint, bigint, bigint];
  const ofacEnabled = [false, false, false] as [boolean, boolean, boolean];
  
  const SelfNFTMinter = await ethers.getContractFactory("SelfNFTMinter");

  console.log("Deploying SelfNFTMinter...");
  const selfNFTMinter = await SelfNFTMinter.deploy(
    identityVerificationHub,
    scope,
    attestationId,
    token,
    olderThanEnabled,
    olderThan,
    forbiddenCountriesEnabled,
    forbiddenCountriesListPacked,
    ofacEnabled
  );
  
  await selfNFTMinter.waitForDeployment();
  
  const deployedAddress = await selfNFTMinter.getAddress();
  console.log("SelfNFTMinter deployed to:", deployedAddress);
  
  console.log("To verify on Celoscan:");
  console.log(`npx hardhat verify --network celo ${deployedAddress} ${identityVerificationHub} ${scope} ${attestationId} ${token} ${olderThanEnabled} ${olderThan} ${forbiddenCountriesEnabled} "[${forbiddenCountriesListPacked.join(',')}]" "[${ofacEnabled.join(',')}]"`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
