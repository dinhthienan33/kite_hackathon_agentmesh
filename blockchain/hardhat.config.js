import { defineConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-ethers";
import hardhatToolboxMochaEthers from "@nomicfoundation/hardhat-toolbox-mocha-ethers";

import * as fs from 'fs';
import * as dotenv from 'dotenv';
dotenv.config({ path: fs.existsSync('./.env') ? './.env' : '../.env' });

export default defineConfig({
  solidity: "0.8.27",
  networks: {
    kiteTestnet: {
      type: "http",
      url: process.env.KITE_RPC_URL || "https://rpc-testnet.gokite.ai",
      chainId: 2368,
      accounts: process.env.KITE_PRIVATE_KEY ? [process.env.KITE_PRIVATE_KEY] : [],
    }
  },
  plugins: [hardhatToolboxMochaEthers],
});
