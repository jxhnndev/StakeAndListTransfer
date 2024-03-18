const { ethers } = require("ethers");

const provider = new ethers.JsonRpcProvider("https://1rpc.io/eth")

abi = [
    "event Transfer(address indexed from, address indexed to, uint amount)"
]

const getBlock = async (timestamp) => {
    console.log("Searching for the block at requested time")
    let latestBlock = await (provider.getBlock('latest'))
    let topBlock = latestBlock.number
    let lowBlock = 0
    let blockTimestamp =  latestBlock.timestamp

    while (blockTimestamp > timestamp) {
      let searchBlock =  lowBlock + Math.floor((topBlock - lowBlock)/2)
      
      let block = await provider.getBlock(searchBlock)

      if (timestamp < block.timestamp + 60 && timestamp > block.timestamp - 60) {
        return block.number
      }

      if (timestamp > block.timestamp) {
        lowBlock = block.number
      } else {
        topBlock = block.number
      }
    }
}

let tx = {};
let contract;
let blockRange = 10000;

const queryNetwork = async (isFrom, queryAdd, initialBlock, lasBlock) => {
  let filter;
  let events;

  if (isFrom) {
    filter = contract.filters.Transfer(queryAdd)
    events = await contract.queryFilter(filter, initialBlock, lasBlock)
    tx[queryAdd].From = tx[queryAdd].From.concat(events)
  } else {
    filter = contract.filters.Transfer(null, queryAdd)
    events = await contract.queryFilter(filter, initialBlock, lasBlock)
    tx[queryAdd].To = tx[queryAdd].To.concat(events)
  }
}

const getTransferEvents = async (contractAdd, queryAdd, requestedBlock) => {
  console.log("Getting From trasactions of address: ", queryAdd)
  let latestBlock = (await provider.getBlock('latest')).number
  contract = new ethers.Contract(contractAdd, abi, provider)
  let currentBlock = requestedBlock;
  tx[queryAdd] = {"From": [], "To": []}

  if ((latestBlock - currentBlock) > blockRange) {
    while ((latestBlock - currentBlock) > blockRange) {
      console.log(`Address ${queryAdd}: Transactions from block ${currentBlock} to ${currentBlock+blockRange}`)
      // From events
      await queryNetwork(true, queryAdd, currentBlock, currentBlock+blockRange)
      // To events
      await queryNetwork(false, queryAdd, currentBlock, currentBlock+blockRange)
  
      currentBlock += blockRange
    }
      // From events
      await queryNetwork(true, queryAdd, currentBlock, latestBlock)
      // To events
      await queryNetwork(false, queryAdd, currentBlock, latestBlock)
    } else {
    // From events
    await queryNetwork(true, queryAdd, requestedBlock, latestBlock)
      // To events
    await queryNetwork(false, queryAdd, requestedBlock, latestBlock)
  }
}

const getTransactions = async (tokenAddress, addressesToCheck, years) => {
  let timestamp = Math.floor(Date.now()/1000) - (years * 365 * 24 * 60 *60)
  let block = await getBlock(timestamp)
  console.log("Starting at block number:", block)
  
  await Promise.all(addressesToCheck.map(async (address) => {
    await getTransferEvents(tokenAddress, address, block);
  }));

  console.log(tx)
};

let addresses = ["0xA72bC80849b5db4c4228D050f4017c350823f5E6", "0x285Ebd4A77A75c9108Bd5ef6018b5CB4771B20C7"]
let contractAddress = "0xdAC17F958D2ee523a2206206994597C13D831ec7"
let years = 0.5

getTransactions(contractAddress, addresses, years).catch((err) => {
  console.error(err);
  process.exit(1);
});
