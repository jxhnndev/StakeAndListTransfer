# Staking and vote contract
Allows to stake an ERC20 token and vote in surveys that are linked to that token. Implemented using a proxy contract and fixed storage to locations allows for upgradability. Proxy makes a delegatecall to the implementation address.

## Flow:

+ User calls ERC20 to approve StakeVote contract to transfer funds.

+ User calls deposit in StakeVote to stake their funds. (**`deposit()`**)

+ StakeVote contract owner registers a survey. (**`registerSurvey()`**)

+ Users can vote to aprove (**`voteApprove()`**) or reject (**`voteReject()`**) that survey.

+ Once the survey has ended users  can recover the used tokens to vote on a new survey. (**`redeemVoteTokens()`**)

+ At any point the users can withdraw the funds they staked and are not used to vote in any survey. (**`withdraw()`**)

## Improvements:
- Add the possibility to change the vote during the survey valid time.
- Multiple choice surveys, not just approve or reject.

