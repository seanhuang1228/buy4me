# Buy4me

This decentralized application is built on the Self protocol, enabling users to verify their identity by scanning a passport and minting a SelfNFT. This NFT represents a unique identity and is strictly non-transferable—functions like `transfer` and `approve` are disabled to protect identity integrity.

Instead of transferring identity, the protocol supports on-chain identity delegation. After claiming a SelfNFT, a user can delegate their identity to another wallet, which is recorded on-chain. This allows the delegate to act on the user’s behalf for specific transactions—without compromising ownership.

One example use case is ticket purchasing. When a user wants to buy tickets, they can pass in an array of SelfNFT IDs that have delegated to them. The contract verifies that:

1. Each delegator (including the buyer, if applicable) hasn’t already received a ticket.
2. Each listed identity has properly delegated authority to the buyer.

Once validated, the buyer pays for the tickets, and the contract automatically distributes each ticket to the corresponding delegator—ensuring fairness, flexibility, and on-chain accountability.

Our contract address on CELO mainnet:
- SelfNFTMinter: `0xDE6C2e93cc36Ad778fa370DF72035283114438f2`
- SelfNFT: `0x41b3d4De71ba2E3b33F080271690b1C7d453Bc14`
- TicketBuyer: `0xFbe3670061C5BEB24caC80517dE85fe56394986d`

## Setup Instructions

### Deploying the Contract

1. Navigate to the `contracts` directory:

   ```
   cd contracts
   ```

2. Install dependencies:

   ```
   yarn install
   ```

3. Build the contracts:

   ```
   yarn run build
   ```

4. Set the passport environment in `contracts/scripts/deploySelfNFTMinter.ts`:

   For real passports (production): Uncomment the production line and comment out the staging line:

   ```
   const DEFAULT_IDENTITY_VERIFICATION_HUB = "0x77117D60eaB7C044e785D68edB6C7E0e134970Ea";
   ```

   For mock passports (staging/testing environment): Keep the staging line uncommented (this is the default):

   ```
   const DEFAULT_IDENTITY_VERIFICATION_HUB = "0x3e2487a250e2A7b56c7ef5307Fb591Cc8C83623D";
   ```

5. Configure environment variables:

   - Copy `.env.example` to `.env`
   - Fill in the required values in the `.env` file

6. Deploy the `SelfNFTMinter` contract (this will automatically deploy the `SelfNFT` contract as well):

   ```
   yarn run deploy:selfNFTMinter
   ```

7. Update the `SelfNFT` address in `scripts/deployTicket.ts`:

   ```
   const selfNFT = "Your SelfNFT address";
   ```

8. Deploy the `TicketSeller` contracts:

   ```
   yarn run deploy:Ticket
   ```

### Deploying the Web Service

1. Navigate to the `frontend` directory:

   ```
   cd frontend
   ```

2. Install dependencies:

   ```
   yarn install
   ```

3. Run in dev mode:

   ```
   yarn dev
   ```

4. Configure environment variables:

   - Copy `.env.example` to `.env`
   - Fill in the required values in the `.env` file

5. Replace the contract address in lib:
   - open `lib/address.ts`
   - replace `MINTER_CONTRACT_ADDRESS` with `SelfNFTMinter` address
   - replace `TICKET_CONTRACT_ADDRESS` with `TicketSeller` address
   - replace `NFT_CONTRACT_ADDRESS` with `SelfNFT` address

