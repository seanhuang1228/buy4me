import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
require("dotenv").config();
import "@nomicfoundation/hardhat-ignition-ethers";
const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
        details: {
          yul: true
        }
      },
      metadata: {
        bytecodeHash: "none"
      },
      viaIR: false,
    },
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  },
  defaultNetwork: "hardhat",
  networks: {
    celo: {
      // chainId: 42220,
      chainId: 44787,
      // url: process.env.CELO_RPC_URL || "https://forno.celo.org",
      url: process.env.CELO_RPC_URL,
      accounts: [process.env.CELO_KEY as string],
    }
  },
  etherscan: {
    apiKey: {
      celo: process.env.CELOSCAN_API_KEY as string,
    },
    customChains: [
      {
        network: "celo",
        // chainId: 42220,
        chainId: 44787,
        urls: {
          apiURL: "https://api.celoscan.io/api",
          browserURL: "https://celoscan.io"
        }
      }
    ]
  }
};
export default config;
