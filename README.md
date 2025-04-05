# Buy4me

This is a decentralized application built with the Self protocol. To get started, you scan your passport and claim your identity by minting an NFT. Once that’s done, you can buy a ticket. Since each verified identity can only be used to purchase one ticket, the system ensures a fairer distribution.

If you want to buy tickets for friends or family, they can delegate their identity to you. You can be delegated by multiple people and purchase tickets on their behalf. Note that delegation does not transfer the identity NFT itself—it only grants permission to buy the ticket. The ticket will be owned by the person whose identity was used, not the buyer.

This makes ticket purchasing both fair and convenient!

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

   