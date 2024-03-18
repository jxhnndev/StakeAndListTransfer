// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.10;

import {SVStorage} from "./Storage/SVStorage.sol";
import {OwnableStorage} from "./Storage/OwnableStorage.sol";

interface IERC20 {
    function totalSupply() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function transfer(address recipient, uint256 amount) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
}

interface IStakeVote {
    /**
     Stake tokens in the contract
    **/
    function deposit(uint256 amount, address token) external;
    /**
     Withdraw staked tokens
    **/
    function withdraw(uint256 amount, address token) external;
    /**
     Return the amount of staked tokens that are not used in surveys
    **/
    function avaliableTokens(address token) external view returns(uint256 amount);
    /**
     Return the amount of staked tokens that are been used in surveys
    **/
    function usedTokens(address token) external view returns(uint256 amount);
    /**
     Return the surveys the user has voted
    **/
    function userSurveys() external view returns(bytes32[] memory);
    /**
     Return the amount of tokens a user has used to vote in a survey
    **/
    function tokensBySurvey(bytes32 surveyId) external view returns(uint256 amount);
    /**
     Create a new survey
    **/
    function registerSurvey(string calldata surveyName, address token, uint256 startTime, uint256 endTime) external;
    /**
     Vote to approve a survery
    **/
    function voteApprove(bytes32 surveyId, uint256 tokenAmount) external returns(uint256);
    /**
     Vote to reject a survery
    **/
    function voteReject(bytes32 surveyId, uint256 tokenAmount) external returns(uint256);
    /**
     Recover the tokens that were used to vote a survery
    **/
    function redeemVoteTokens(bytes32 surveyId) external;
    /**
     Return the information of a survey
    **/
    function surveyData(bytes32 surveyId) external view returns(SVStorage.Survey memory);
}

contract StakeVote is IStakeVote {

    event SurveyRegistered(bytes32 SurveyId, string Name, address Token);
    event SurveyVoted(bytes32 SurveyId, uint256 VotesApprove, uint256 VotesReject);

    //--------------------Tokens---------------------//

    function deposit(uint256 amount, address token) external override {
        SVStorage.Layout storage l = SVStorage.svStorage();
        IERC20(token).transferFrom(msg.sender, address(this), amount);
        l.users[msg.sender].stakedToken[token].totalBalance += amount;
    }
    
    function withdraw(uint256 amount, address token) external override {
        SVStorage.Layout storage l = SVStorage.svStorage();
        require((l.users[msg.sender].stakedToken[token].totalBalance - l.users[msg.sender].stakedToken[token].stakedBalance) >= amount, "Not enough tokens available to withdraw");
        l.users[msg.sender].stakedToken[token].totalBalance -= amount;
        IERC20(token).transfer(msg.sender, amount);
    }

    function avaliableTokens(address token) external override view returns(uint256 amount) {
        SVStorage.Layout storage l = SVStorage.svStorage();
        return (l.users[msg.sender].stakedToken[token].totalBalance - l.users[msg.sender].stakedToken[token].stakedBalance); 
    }

    function usedTokens(address token) external override view returns(uint256 amount) {
        SVStorage.Layout storage l = SVStorage.svStorage();
        return l.users[msg.sender].stakedToken[token].stakedBalance; 
    }

    function userSurveys() external override view returns(bytes32[] memory) {
        SVStorage.Layout storage l = SVStorage.svStorage();
        return l.users[msg.sender].surverysVoted;
    }

    function tokensBySurvey(bytes32 surveyId) external override view returns(uint256 amount) {
        SVStorage.Layout storage l = SVStorage.svStorage();
        return l.users[msg.sender].balanceBySurvey[surveyId];
    }

    //--------------------Surveys---------------------//

    function registerSurvey(string calldata surveyName, address token, uint256 startTime, uint256 endTime) external onlyOwner override {
        SVStorage.Layout storage l = SVStorage.svStorage();
        bytes32 surveyId = keccak256(abi.encode(surveyName, token, block.timestamp, startTime, endTime));
        l.surveys[surveyId].name = surveyName;
        l.surveys[surveyId].token = token;
        l.surveys[surveyId].startTime = startTime;
        l.surveys[surveyId].endTime = endTime;

        emit SurveyRegistered(surveyId, surveyName, token);
    }

    function voteApprove(bytes32 surveyId, uint256 tokenAmount) external override returns(uint256) {
        return voteSurvey(true, surveyId, tokenAmount);
    }
    
    function voteReject(bytes32 surveyId, uint256 tokenAmount) external override returns(uint256) {
        return voteSurvey(false, surveyId, tokenAmount);
    }

    function voteSurvey(bool approveSurvey, bytes32 surveyId, uint256 tokenAmount) internal returns(uint256) {
        SVStorage.Layout storage l = SVStorage.svStorage();
        SVStorage.Survey storage survey = l.surveys[surveyId];
        require(block.timestamp >= survey.startTime, "Survey has not started yet");
        require(block.timestamp < survey.endTime, "Survey is finished");
        
        address token = survey.token;
        require((l.users[msg.sender].stakedToken[token].totalBalance - l.users[msg.sender].stakedToken[token].stakedBalance) >= tokenAmount, "Not enough tokens to vote");
        
        l.users[msg.sender].stakedToken[token].stakedBalance += tokenAmount;
        l.users[msg.sender].balanceBySurvey[surveyId] += tokenAmount;
        l.users[msg.sender].surverysVoted.push(surveyId);

        if (approveSurvey) {
            survey.votesApprove += tokenAmount;
            emit SurveyVoted(surveyId, survey.votesApprove, survey.votesReject);
            return survey.votesApprove;
        } else {
            survey.votesReject += tokenAmount;
            emit SurveyVoted(surveyId, survey.votesApprove, survey.votesReject);
            return survey.votesReject;
        }
    }

    function redeemVoteTokens(bytes32 surveyId) external override {
        SVStorage.Layout storage l = SVStorage.svStorage();
        SVStorage.Survey storage survey = l.surveys[surveyId];
        require(block.timestamp >= survey.endTime, "Survey is not finished");
        address token = survey.token;
        require(l.users[msg.sender].balanceBySurvey[surveyId] > 0, "No tokens staked in this survey");
        l.users[msg.sender].stakedToken[token].stakedBalance -= l.users[msg.sender].balanceBySurvey[surveyId];
        l.users[msg.sender].balanceBySurvey[surveyId] = 0;
    }

    function surveyData(bytes32 surveyId) external override view returns(SVStorage.Survey memory) {
        SVStorage.Layout storage l = SVStorage.svStorage();
        return(l.surveys[surveyId]);
    }


    //--------------------Utils---------------------//

    event OwnershipChanged(address previousOwner, address newOwner);

    function owner() external view returns(address) {
        return _owner();
    }

    function _owner() internal view returns(address) {
        return OwnableStorage.ownableStorage().owner;
    }

    function transferOwnership(address _newOwner) external onlyOwner {
        OwnableStorage.Layout storage l = OwnableStorage.ownableStorage();
        address previousOwner = l.owner;
        l.owner = payable(_newOwner);
        emit OwnershipChanged(previousOwner, _newOwner);
    }

    //--------------------Modifiers---------------------//

    modifier onlyOwner(){
        require(msg.sender == _owner(), "Not the owner");
        _;
    }

}
