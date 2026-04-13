const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");

// Logic tìm .env cực kỳ chuẩn xác cho cả Docker và Local
const envPaths = [
    path.resolve(__dirname, "../.env"),
    path.resolve(__dirname, "../../.env"),
    path.resolve(process.cwd(), ".env"),
    "/usr/src/app/.env",
    "./.env"
];

let envPath = envPaths.find(p => fs.existsSync(p));

if (!envPath) {
    console.error("❌ FATAL: Could not find .env file in any of these paths:", envPaths);
    process.exit(1);
}

console.log(`✅ Using .env at: ${envPath}`);
const envContentRaw = fs.readFileSync(envPath, "utf-8");
const config = dotenv.parse(envContentRaw);

async function main() {
    console.log("🚀 STARTING OFFLINE DEPLOYMENT (Using Plain Ethers.js)");
    
    // Connect to local Hardhat node
    const provider = new ethers.JsonRpcProvider("http://localhost:8545");
    
    // Account #0 from Hardhat (or via .env)
    const privateKey = config.KITE_PRIVATE_KEY || process.env.KITE_PRIVATE_KEY;
    if (!privateKey) {
        throw new Error("KITE_PRIVATE_KEY is missing from .env");
    }
    const wallet = new ethers.Wallet(privateKey, provider);
    console.log("Deployer:", wallet.address);

    // Get the starting nonce once to avoid race conditions with Hardhat automine
    let currentNonce = await provider.getTransactionCount(wallet.address);

    const deployContract = async (name) => {
        console.log(`Deploying ${name}... (nonce: ${currentNonce})`);
        const artifactPath = path.resolve(__dirname, `../artifacts/contracts/${name}.sol/${name}.json`);
        if (!fs.existsSync(artifactPath)) {
            throw new Error(`Artifact not found for ${name} at ${artifactPath}. Did you run npx hardhat compile on Host?`);
        }
        const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf-8"));
        const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, wallet);
        const contract = await factory.deploy({ nonce: currentNonce });
        currentNonce++; // Increment immediately after sending
        await contract.waitForDeployment();
        const address = await contract.getAddress();
        console.log(`✅ ${name} deployed to: ${address}`);
        return address;
    };

    const passportAddr = await deployContract("AgentPassport");
    const registryAddr = await deployContract("AgentRegistry");
    const escrowAddr = await deployContract("AgentMeshEscrow");

    // Update .env
    console.log("Updating .env file...");
    let envContent = envContentRaw;
    
    const updateEnv = (key, value) => {
        const regex = new RegExp(`^${key}=.*`, 'm');
        if (regex.test(envContent)) {
            envContent = envContent.replace(regex, `${key}=${value}`);
        } else {
            envContent += `\n${key}=${value}`;
        }
    };

    updateEnv("AGENT_PASSPORT_ADDRESS", passportAddr);
    updateEnv("AGENT_REGISTRY_ADDRESS", registryAddr);
    updateEnv("AGENT_ESCROW_ADDRESS", escrowAddr);
    updateEnv("USE_MOCK_CHAIN", "false");
    
    fs.writeFileSync(envPath, envContent);
    console.log("✅ .env updated successfully.");
    console.log("🎉 OFFLINE DEPLOYMENT COMPLETE");
}

main().catch(err => {
    console.error("❌ Deployment failed:", err.message);
    process.exit(1);
});
