
const {deployContract} = require("../scripts/deploy");
const { expect } = require("chai");
const hardhatHelp = require("@nomicfoundation/hardhat-network-helpers");

describe("Stake vote", function () {
  let accounts;
  let contract;
  let proxyAddress;
  let sID1;
  let sID2;
  let tx;
  let receipt;

  it("Deposit tokens", async function () {

    accounts = await ethers.getSigners();

    proxyAddress = deployContract()

    proxy = await ethers.getContractAt('Proxy', proxyAddress);
    contract = await ethers.getContractAt('StakeVote', proxyAddress);

    await InitializeERC20(contract)

    /* ---------------- Deposit tokens ----------------*/
    await contract.connect(accounts[1]).deposit(5000000, erc20.address)
    await contract.connect(accounts[2]).deposit(5000000, erc20.address)
    await contract.connect(accounts[3]).deposit(5000000, erc20.address)

    expect(await contract.connect(accounts[1]).avaliableTokens(erc20.address)).to.equal(5000000)
    expect(await contract.connect(accounts[2]).avaliableTokens(erc20.address)).to.equal(5000000)
    expect(await contract.connect(accounts[3]).avaliableTokens(erc20.address)).to.equal(5000000)
  });

  it("Create surveys and vote them", async function () {
    /* ---------------- Create survey ----------------*/
    tx = await contract.registerSurvey("Example", erc20.address, Math.floor(Date.now()/1000)-100, Math.floor(Date.now()/1000)+500);
    receipt = await tx.wait();
    sID1 = receipt.events[0].args[0]

    /* ---------------- Vote in survey 1 ----------------*/
    tx = await contract.connect(accounts[1]).voteApprove(sID1, 1000000)
    tx = await contract.connect(accounts[2]).voteApprove(sID1, 1000000)
    tx = await contract.connect(accounts[3]).voteReject(sID1, 1500000)
    
    tx = await contract.registerSurvey("Example2", erc20.address, Math.floor(Date.now()/1000)-100, Math.floor(Date.now()/1000)+500);
    receipt = await tx.wait();
    sID2 = receipt.events[0].args[0]

    expect(await contract.connect(accounts[1]).avaliableTokens(erc20.address)).to.equal(4000000) 
    expect(await contract.connect(accounts[1]).usedTokens(erc20.address)).to.equal(1000000)
    expect(await contract.connect(accounts[2]).avaliableTokens(erc20.address)).to.equal(4000000) 
    expect(await contract.connect(accounts[2]).usedTokens(erc20.address)).to.equal(1000000)
    expect(await contract.connect(accounts[3]).avaliableTokens(erc20.address)).to.equal(3500000) 
    expect(await contract.connect(accounts[3]).usedTokens(erc20.address)).to.equal(1500000)

    expect(await contract.connect(accounts[1]).userSurveys()).to.have.all.members([sID1]);
  });

  it("Update the implementation", async function () {
    /* ---------------- Update contract ----------------*/
    const StakeVote = await ethers.getContractFactory("StakeVote");
    stakeVote = await StakeVote.deploy();
    await stakeVote.deployed();

    await proxy.setImplementation(stakeVote.address)
    expect(await proxy.getImplementation()).to.equal(stakeVote.address);
  });

  it("Create survey with new implementaion and vote", async function () {
    /* ---------------- Vote survey 2 ----------------*/
    tx = await contract.connect(accounts[1]).voteApprove(sID2, 2000000)
    expect(await contract.connect(accounts[1]).userSurveys()).to.have.all.members([sID1, sID2]);

    expect(await contract.connect(accounts[1]).avaliableTokens(erc20.address)).to.equal(2000000) 
    expect(await contract.connect(accounts[1]).usedTokens(erc20.address)).to.equal(3000000)
    expect(await contract.connect(accounts[2]).avaliableTokens(erc20.address)).to.equal(4000000) 
    expect(await contract.connect(accounts[2]).usedTokens(erc20.address)).to.equal(1000000)
    expect(await contract.connect(accounts[3]).avaliableTokens(erc20.address)).to.equal(3500000) 
    expect(await contract.connect(accounts[3]).usedTokens(erc20.address)).to.equal(1500000)
  });

  it("Reedem tokens used to vote", async function () {
    await hardhatHelp.time.increase(36000);

    expect(await contract.connect(accounts[1]).tokensBySurvey(sID1)).to.equal(1000000)
    expect(await contract.connect(accounts[1]).tokensBySurvey(sID2)).to.equal(2000000)

    /* ---------------- Recover used tokens by Account 1 in survey 1 ----------------*/
    await contract.connect(accounts[1]).redeemVoteTokens(sID1)

    expect(await contract.connect(accounts[1]).avaliableTokens(erc20.address)).to.equal(3000000) 
    expect(await contract.connect(accounts[1]).usedTokens(erc20.address)).to.equal(2000000)

    /* ---------------- Withdraw some tokens ----------------*/
    await contract.connect(accounts[1]).withdraw(await contract.connect(accounts[1]).avaliableTokens(erc20.address), erc20.address)
    expect(await contract.connect(accounts[1]).avaliableTokens(erc20.address)).to.equal(0) 

    /* ---------------- Reedem used tokens in surveys by all accounts ----------------*/
    await contract.connect(accounts[1]).redeemVoteTokens(sID2)
    await contract.connect(accounts[2]).redeemVoteTokens(sID1)
    await contract.connect(accounts[3]).redeemVoteTokens(sID1)

    expect(await contract.connect(accounts[1]).tokensBySurvey(sID1)).to.equal(0)
    expect(await contract.connect(accounts[1]).tokensBySurvey(sID2)).to.equal(0)

    expect(await contract.connect(accounts[1]).avaliableTokens(erc20.address)).to.equal(2000000) 
    expect(await contract.connect(accounts[1]).usedTokens(erc20.address)).to.equal(0)
    expect(await contract.connect(accounts[2]).avaliableTokens(erc20.address)).to.equal(5000000) 
    expect(await contract.connect(accounts[2]).usedTokens(erc20.address)).to.equal(0)
    expect(await contract.connect(accounts[3]).avaliableTokens(erc20.address)).to.equal(5000000) 
    expect(await contract.connect(accounts[3]).usedTokens(erc20.address)).to.equal(0)
  });

  it("Withdraw staked tokens", async function () {   
    /* ---------------- Withdraw all staked tokens ----------------*/
    await contract.connect(accounts[1]).withdraw(2000000, erc20.address)
    await contract.connect(accounts[2]).withdraw(5000000, erc20.address)
    await contract.connect(accounts[3]).withdraw(5000000, erc20.address)

    expect(await contract.connect(accounts[1]).avaliableTokens(erc20.address)).to.equal(0) 
    expect(await contract.connect(accounts[1]).usedTokens(erc20.address)).to.equal(0)
    expect(await contract.connect(accounts[2]).avaliableTokens(erc20.address)).to.equal(0) 
    expect(await contract.connect(accounts[2]).usedTokens(erc20.address)).to.equal(0)
    expect(await contract.connect(accounts[3]).avaliableTokens(erc20.address)).to.equal(0) 
    expect(await contract.connect(accounts[3]).usedTokens(erc20.address)).to.equal(0)
  });


  const InitializeERC20 = async (SVContract) => {
    Erc20 = await ethers.getContractFactory("ERC20");
    erc20 = await Erc20.deploy();
    await erc20.deployed();

    await erc20.mint(accounts[1].address, 100000000);
    await erc20.mint(accounts[2].address, 100000000);
    await erc20.mint(accounts[3].address, 100000000);

    await erc20.connect(accounts[1]).approve(SVContract.address, 5000000)
    await erc20.connect(accounts[2]).approve(SVContract.address, 5000000)
    await erc20.connect(accounts[3]).approve(SVContract.address, 5000000)
  } 
});
