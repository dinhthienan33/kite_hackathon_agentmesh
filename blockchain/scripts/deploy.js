import hre from "hardhat";
const ethers = hre.ethers;
import fs from "fs";
import path from "path";

async function main() {
  console.log("=".repeat(60));
  console.log("  🚀 KITE TESTNET DEPLOYMENT");
  console.log("=".repeat(60));

  const [deployer] = await ethers.getSigners();
  console.log(`Deploying contracts with the account: ${deployer.address}`);
  
  const network = await ethers.provider.getNetwork();
  console.log(`Connected to network: ${network.name} (Chain ID: ${network.chainId})`);

  // Bypass balance check for local simulation
  if (network.chainId !== 2368 && balance === 0n) {
    console.error("❌ INSUFFICIENT FUNDS! You need test KITE tokens to deploy.");
    console.error("   ➡️  Go to https://faucet.gokite.ai to claim tokens.\n");
    process.exit(1);
  }

  // 1. Deploy AgentPassport
  console.log("Deploying AgentPassport...");
  const AgentPassport = await ethers.getContractFactory("AgentPassport");
  const passport = await AgentPassport.deploy();
  await passport.waitForDeployment();
  const passportAddress = await passport.getAddress();
  console.log(`✅ AgentPassport deployed to: ${passportAddress}`);

  // 2. Deploy AgentRegistry
  console.log("Deploying AgentRegistry...");
  const AgentRegistry = await ethers.getContractFactory("AgentRegistry");
  const registry = await AgentRegistry.deploy();
  await registry.waitForDeployment();
  const registryAddress = await registry.getAddress();
  console.log(`✅ AgentRegistry deployed to: ${registryAddress}`);

  // 3. Deploy AgentMeshEscrow
  console.log("Deploying AgentMeshEscrow...");
  const AgentMeshEscrow = await ethers.getContractFactory("AgentMeshEscrow");
  const escrow = await AgentMeshEscrow.deploy();
  await escrow.waitForDeployment();
  const escrowAddress = await escrow.getAddress();
  console.log(`✅ AgentMeshEscrow deployed to: ${escrowAddress}`);

  console.log("\nUpdating .env file with contract addresses...");
  const envPaths = [
    "/usr/src/app/.env",
    "../.env",
    "./.env",
    path.resolve(process.cwd(), "../../.env")
  ];
  let envPath = envPaths.find(p => fs.existsSync(p));
  if (!envPath) {
      console.warn("⚠️ Could not find .env file; creating a new one from addresses.");
      envPath = "./.env";
      fs.writeFileSync(envPath, "");
  }
  
  console.log(`Using .env at: ${envPath}`);
  let envContent = fs.readFileSync(envPath, "utf-8");

  const updateEnv = (key, value) => {
    const regex = new RegExp(`^${key}=.*`, 'm');
    if (regex.test(envContent)) {
      envContent = envContent.replace(regex, `${key}=${value}`);
    } else {
      envContent += `\n${key}=${value}`;
    }
  };

  updateEnv("AGENT_PASSPORT_ADDRESS", passportAddress);
  updateEnv("AGENT_REGISTRY_ADDRESS", registryAddress);
  updateEnv("AGENT_ESCROW_ADDRESS", escrowAddress);
  updateEnv("USE_MOCK_CHAIN", "false");
  updateEnv("KITE_RPC_URL", "http://agentmesh-chain:8545");

  fs.writeFileSync(envPath, envContent);
  console.log("✅ .env file updated successfully.");

  // 5. Register seed workers
  console.log("\nRegistering seed workers in AgentRegistry...");
  // Designer: PixelForge AI
  const tx1 = await registry.registerWorker(
    "Designer", 
    ethers.parseEther("5") // Note: The mock specifies 5.0 baseRate, we'll store as string or wei
  );
  await tx1.wait();
  console.log("   ✅ Registered Designer Worker");

  // Researcher: DeepSearch AI
  const tx2 = await registry.registerWorker(
    "Researcher",
    ethers.parseEther("2")
  );
  await tx2.wait();
  console.log("   ✅ Registered Researcher Worker");

  console.log("\n" + "=".repeat(60));
  console.log("  🎉 DEPLOYMENT COMPLETE");
  console.log("=".repeat(60));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
