const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");

const envPaths = [
    path.resolve(__dirname, "../.env"),
    path.resolve(__dirname, "../../.env"),
    path.resolve(process.cwd(), ".env"),
    path.resolve(process.cwd(), "../.env")
];

let envPath = envPaths.find(p => fs.existsSync(p));

if (!envPath) {
    console.error("❌ FATAL: Could not find .env file");
    process.exit(1);
}

console.log(`✅ Using .env at: ${envPath}`);
const envContentRaw = fs.readFileSync(envPath, "utf-8");
const config = dotenv.parse(envContentRaw);

async function main() {
    console.log("🚀 STARTING KITE TESTNET DEPLOYMENT");
    
    const provider = new ethers.JsonRpcProvider("https://rpc-testnet.gokite.ai");
    
    const privateKey = config.KITE_PRIVATE_KEY || process.env.KITE_PRIVATE_KEY;
    if (!privateKey) {
        throw new Error("KITE_PRIVATE_KEY is missing from .env");
    }
    const wallet = new ethers.Wallet(privateKey, provider);
    console.log("Deployer:", wallet.address);

    const balance = await provider.getBalance(wallet.address);
    console.log(`Account balance: ${ethers.formatEther(balance)} KITE`);

    if (balance === 0n) {
      console.error("❌ INSUFFICIENT FUNDS! You need test KITE tokens to deploy.");
      process.exit(1);
    }

    let currentNonce = await provider.getTransactionCount(wallet.address);

    const deployContract = async (name) => {
        console.log(`Deploying ${name}... (nonce: ${currentNonce})`);
        const artifactPath = path.resolve(__dirname, `../artifacts/contracts/${name}.sol/${name}.json`);
        if (!fs.existsSync(artifactPath)) {
            throw new Error(`Artifact not found for ${name}.`);
        }
        const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf-8"));
        const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, wallet);
        const contract = await factory.deploy({ nonce: currentNonce });
        currentNonce++;
        await contract.waitForDeployment();
        const address = await contract.getAddress();
        console.log(`✅ ${name} deployed to: ${address}`);
        return { address, contract };
    };

    const { address: passportAddr } = await deployContract("AgentPassport");
    const { address: registryAddr, contract: registry } = await deployContract("AgentRegistry");
    const { address: escrowAddr } = await deployContract("AgentMeshEscrow");

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
    
    console.log("\nRegistering seed workers in AgentRegistry...");
    console.log("Registering Designer (nonce: " + currentNonce + ")");
    const tx1 = await registry.registerWorker("Designer", ethers.parseEther("5"), { nonce: currentNonce++ });
    await tx1.wait();
    console.log("   ✅ Registered Designer Worker");

    console.log("Registering Researcher (nonce: " + currentNonce + ")");
    const tx2 = await registry.registerWorker("Researcher", ethers.parseEther("2"), { nonce: currentNonce++ });
    await tx2.wait();
    console.log("   ✅ Registered Researcher Worker");

    console.log("🎉 TESTNET DEPLOYMENT COMPLETE");
}

main().catch(err => {
    console.error("❌ Deployment failed:", err.message);
    process.exit(1);
});
