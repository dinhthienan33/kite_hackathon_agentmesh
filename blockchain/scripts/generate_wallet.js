import { ethers } from "ethers";

// Generate a brand new random wallet
const wallet = ethers.Wallet.createRandom();

console.log("=".repeat(60));
console.log("  🪁 NEW KITE TESTNET WALLET GENERATED");
console.log("=".repeat(60));
console.log();
console.log("  Address:      ", wallet.address);
console.log("  Private Key:  ", wallet.privateKey);
console.log("  Mnemonic:     ", wallet.mnemonic.phrase);
console.log();
console.log("=".repeat(60));
console.log("  ⚠️  SAVE YOUR PRIVATE KEY & MNEMONIC SECURELY!");
console.log("  ⚠️  Never share your private key with anyone.");
console.log("=".repeat(60));
console.log();
console.log("  NEXT STEPS:");
console.log("  1. Copy the Private Key into .env as KITE_PRIVATE_KEY");
console.log("  2. Go to https://faucet.gokite.ai to get test KITE tokens");
console.log("     (paste your Address above)");
console.log("  3. Verify on https://testnet.kitescan.ai/address/" + wallet.address);
console.log();
