const hre = require("hardhat");

exports.deployContract = async function deployContract() {

  const StakeVote = await ethers.getContractFactory("StakeVote");
  let stakeVote = await StakeVote.deploy();
  await stakeVote.deployed();

  const Proxy = await (await ethers.getContractFactory('Proxy'))
  const proxy = await Proxy.deploy(stakeVote.address);
  await proxy.deployed();

  let contractC = await (await ethers.getContractAt("StakeVote", proxy.address))
  console.log("Owner account", await contractC.owner())

  console.log(`Proxy address ${proxy.address} implementation address ${stakeVote.address}`);

  return(proxy.address)
}

if (require.main === module) {
  deployContract()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}