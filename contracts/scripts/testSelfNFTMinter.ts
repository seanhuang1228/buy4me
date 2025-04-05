import { ethers } from "hardhat";
import { expect } from "chai";

async function main() {
  // Address of the deployed SelfNFTMinter contract (replace with your actual deployed address)
  const deployedAddress = "0x0A11C254A9c242e87DDDcf329b9e16104CDb993f";

  // ABI of the deployed contract (only including the selfNFT variable)
  const getSelfNFTAddressABI = [
    "function selfNFT() external view returns (address)"
  ];

  // Connect to the network (in this case, using the Hardhat provider)
  const [owner] = await ethers.getSigners();  // Get the signer (owner of the contract)

  // Connect to the deployed contract
  const SelfNFTMinterContract = new ethers.Contract(deployedAddress, getSelfNFTAddressABI, owner);

  // Retrieve the public selfNFT variable directly
  try {
    const selfNFTAddress = await SelfNFTMinterContract.selfNFT();
    console.log("The SelfNFT contract address is: ", selfNFTAddress);

    // Now we connect to the SelfNFT contract
    const selfNFTABI = [
      "function mint(address to) external",
      "function owner() external view returns (address)"
    ];

    const SelfNFTContract = new ethers.Contract(selfNFTAddress, selfNFTABI, owner);

    // Check the contract owner
    const ownerOfSelfNFT = new ethers.Contract(selfNFTAddress, ["function owner() external view returns (address)"], owner);
    try {
      const contractOwner = await ownerOfSelfNFT.owner();
      console.log("The owner of the SelfNFT contract is: ", contractOwner);

      // Check if the deployed address matches the owner of the contract
      if (deployedAddress.toLowerCase() === contractOwner.toLowerCase()) {
        console.log("The deployed address is the same as the contract owner.");
      } else {
        console.log("The deployed address is different from the contract owner.");
      }

    } catch (error) {
      console.error("Error retrieving contract owner:", error);
    }

    // Check whether non-owner can mint selfNFT
    await expect(SelfNFTContract.connect(owner).mint(owner.address)).to.be.reverted;
    console.log("Minting reverted for non-owner user as expected");

  } catch (error) {
    console.error("Error retrieving selfNFT address:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
