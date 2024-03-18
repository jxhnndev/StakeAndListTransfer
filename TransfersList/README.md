# List transfer from accounts
Calling and rpc endpoint creates a list of all the Transfer events that have been emitted by an ERC20 token where From or To was one address of a given list.
 ```js
getTransactions(contractAddress, addresses, years)
```
Input parameters example:
```js
let addresses = ["0xA72bC80849b5db4c4228D050f4017c350823f5E6", "0x285Ebd4A77A75c9108Bd5ef6018b5CB4771B20C7"]
let contractAddress = "0xdAC17F958D2ee523a2206206994597C13D831ec7"
let years = 1
```
## Flow
- Calculates the first block to query base on the number of years provided. Using the timestamp finds the closest block mined at that date. (**`getBlock()`**)

- Iterates over the **`addresses`** variable list to get the transfer events emitted by the ERC20 token **`contractAddress`** that includes the address as From or To. (**`getTransferEvents()`**)

- Calls the rpc endpoint querying the logs in a range of 10000 blocks. Performs that petition in a loop until it reaches the last mined block of the network. (**`queryNetwork()`**)

    - RPC endpoint limit is 10000 block but response size is 2097152 bytes. Queries for addresses with many transactions are over the size limit. In that cases the variable **`blockRange`** must be change to a smaller block amount.

- Stores the event information in the variable **`tx`** in json format:
 ```json
    tx = {"Address1": {"From": ["TransferEventLog1...",  "TransferEventLog2...", "..."], "To": ["TransferEventLog3...",  "TransferEventLog4...", "..."]},
          "Address2": {"From": ["TransferEventLog1...",  "TransferEventLog2...", "..."], "To": ["TransferEventLog3...",  "TransferEventLog4...", "..."]},
          ...
          ...
          ...
    }
```


## Improvements:
By using 3rd pary services like Moralis API, it is possible to get all the Transfers from a contract where the address is From or To with a single API call, to **`getWalletTokenTransfers`** endpoint.
```js
  await Moralis.EvmApi.token.getWalletTokenTransfers({
    "chain": "0x1",
    "order": "DESC",
    "contractAddresses": [
      "0xdAC17F958D2ee523a2206206994597C13D831ec7"
    ],
    "fromDate": "1678892971",
    "toDate": "1710515371",
    "address": "0x285Ebd4A77A75c9108Bd5ef6018b5CB4771B20C7"
  });
```

Using the timestamp and getting all the transactions in a single petition, saving a lot time and simplifiying the process and the code.