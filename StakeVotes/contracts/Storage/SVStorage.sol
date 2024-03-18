// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.10;

library SVStorage {
    bytes32 constant STAKEVOTE_SLOT = keccak256("arilucea.contracts.storage.stakevote");

    struct Survey {
        string name;
        uint256 votesApprove;
        uint256 votesReject;
        address token;
        uint256 startTime;
        uint256 endTime;
    }

    struct Voter {
        mapping (bytes32 => uint256) balanceBySurvey;
        mapping (address => Tokens) stakedToken;
        bytes32[] surverysVoted;
    }

    struct Tokens {
        uint256 totalBalance;
        uint256 stakedBalance;
    }

    struct Layout {
        mapping(bytes32 => Survey) surveys;
        mapping(address => Voter) users;
    }

    function svStorage() internal pure returns(Layout storage l) {
        bytes32 position = STAKEVOTE_SLOT;
        assembly {
            l.slot := position
        }
    }
}