import { GokiteAASDK } from 'gokite-aa-sdk';
import { ethers } from 'ethers';

const rpcUrl = process.env.KITE_TESTNET_RPC || "https://rpc-testnet.gokite.ai";
const bundlerUrl = process.env.KITE_BUNDLER_URL || "https://bundler-service.staging.gokite.ai/rpc/";

// Initialize the AA SDK
export const aaSdk = new GokiteAASDK(
  'kite_testnet',
  rpcUrl,
  bundlerUrl
);

/**
 * Returns a signing function based on the provided private key
 * Note: In production, never pass private keys via API. For the hackathon,
 * we securely use the env variables passed between the python backend and this proxy.
 */
export const getSignFunction = (privateKey: string) => {
  return async (userOpHash: string): Promise<string> => {
    const signer = new ethers.Wallet(privateKey);
    return signer.signMessage(ethers.getBytes(userOpHash));
  };
};

/**
 * Creates or gets the Account Abstraction Wallet address
 */
export const getAAWallet = (signerAddress: string) => {
    return aaSdk.getAccountAddress(signerAddress);
};

/**
 * Perform a generic user operation manually if needed
 */
export const sendOperation = async (privateKey: string, eoa: string, targetAddress: string, callData: string, value: string = "0") => {
  const signFunc = getSignFunction(privateKey);
  const request = {
    target: targetAddress,
    value: ethers.parseEther(value),
    callData: callData
  };
  return await aaSdk.sendUserOperationAndWait(eoa, request, signFunc);
};
