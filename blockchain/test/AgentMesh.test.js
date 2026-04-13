import { expect } from "chai";
import { network } from "hardhat";

describe("AgentMesh Smart Contracts", function () {
  let ethers;

  before(async function () {
    const connection = await network.connect();
    ethers = connection.ethers;
  });

  it("TC-1.1: Mint Kite Agent Passport", async function () {
    const AgentPassport = await ethers.getContractFactory("AgentPassport");
    const passport = await AgentPassport.deploy();
    await passport.waitForDeployment();
    
    const tx = await passport.mint();
    const receipt = await tx.wait();
    expect(receipt?.logs.length).to.be.greaterThan(0);
  });

  it("TC-1.2: Register Worker Capabilities", async function () {
    const AgentRegistry = await ethers.getContractFactory("AgentRegistry");
    const registry = await AgentRegistry.deploy();
    await registry.waitForDeployment();
    
    const tx = await registry.registerWorker("Designer", 5);
    await tx.wait();
    
    const signers = await ethers.getSigners();
    const agentData = await registry.agents(signers[0].address);
    expect(agentData.role).to.equal("Designer");
    expect(agentData.baseRate).to.equal(5n);
  });

  it("TC-2.1: Deposit Funds & Spend Limit", async function () {
    const AgentMeshEscrow = await ethers.getContractFactory("AgentMeshEscrow");
    const escrow = await AgentMeshEscrow.deploy();
    await escrow.waitForDeployment();
    
    await escrow.deposit({ value: ethers.parseEther("5") });
    await expect(escrow.deposit({ value: ethers.parseEther("15") })).to.be.revertedWith("Exceeds spend limit");
  });

  it("TC-2.2 & 2.3: Escrow Locking and Zero-Gas Release", async function () {
    const signers = await ethers.getSigners();
    const manager = signers[0];
    const worker = signers[1];
    
    const AgentMeshEscrow = await ethers.getContractFactory("AgentMeshEscrow");
    const escrow = await AgentMeshEscrow.deploy();
    await escrow.waitForDeployment();
    
    const taskId = ethers.id("task1");
    await escrow.connect(manager).deposit({ value: ethers.parseEther("5") });
    await escrow.connect(manager).lock(taskId, ethers.parseEther("5"));
    
    const balanceBefore = await ethers.provider.getBalance(worker.address);
    await escrow.connect(manager).releaseFunds(taskId, worker.address);
    const balanceAfter = await ethers.provider.getBalance(worker.address);
    
    expect(balanceAfter - balanceBefore).to.equal(ethers.parseEther("5"));
  });
});
