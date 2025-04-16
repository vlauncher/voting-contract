// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";

contract VotingSystem is Ownable {
    struct Candidate {
        string name;
        uint256 voteCount;
    }

    struct Voter {
        bool hasVoted;
        uint256 votedCandidateId;
    }

    struct Election {
        string title;
        bool isActive;
        uint256 endTime;
        mapping(uint256 => Candidate) candidates;
        uint256 candidateCount;
        mapping(address => Voter) voters;
    }

    mapping(uint256 => Election) public elections;
    uint256 public electionCount;

    event ElectionCreated(uint256 electionId, string title, uint256 endTime);
    event CandidateAdded(uint256 electionId, uint256 candidateId, string name);
    event Voted(uint256 electionId, address voter, uint256 candidateId);
    event ElectionEnded(uint256 electionId, uint256 winningCandidateId);

    constructor() Ownable(msg.sender) {
        electionCount = 0;
    }

    function createElection(string memory title, uint256 duration) public onlyOwner {
        electionCount++;
        uint256 electionId = electionCount;
        Election storage election = elections[electionId];
        election.title = title;
        election.isActive = true;
        election.endTime = block.timestamp + duration;
        election.candidateCount = 0;
        emit ElectionCreated(electionId, title, election.endTime);
    }

    function addCandidate(uint256 electionId, string memory name) public onlyOwner {
        Election storage election = elections[electionId];
        require(election.isActive, "Election is not active");
        require(block.timestamp < election.endTime, "Election has ended");
        election.candidateCount++;
        uint256 candidateId = election.candidateCount;
        election.candidates[candidateId] = Candidate(name, 0);
        emit CandidateAdded(electionId, candidateId, name);
    }

    function vote(uint256 electionId, uint256 candidateId) public {
        Election storage election = elections[electionId];
        require(election.isActive, "Election is not active");
        require(block.timestamp < election.endTime, "Election has ended");
        require(!election.voters[msg.sender].hasVoted, "Already voted");
        require(candidateId > 0 && candidateId <= election.candidateCount, "Invalid candidate");

        election.voters[msg.sender] = Voter(true, candidateId);
        election.candidates[candidateId].voteCount++;
        emit Voted(electionId, msg.sender, candidateId);
    }

    function endElection(uint256 electionId) public onlyOwner {
        Election storage election = elections[electionId];
        require(election.isActive, "Election is not active");
        require(block.timestamp >= election.endTime, "Election not ended yet");

        election.isActive = false;
        uint256 winningCandidateId = getWinningCandidate(electionId);
        emit ElectionEnded(electionId, winningCandidateId);
    }

    function getWinningCandidate(uint256 electionId) public view returns (uint256) {
        Election storage election = elections[electionId];
        require(!election.isActive, "Election is still active");

        uint256 maxVotes = 0;
        uint256 winningCandidateId = 0;
        for (uint256 i = 1; i <= election.candidateCount; i++) {
            if (election.candidates[i].voteCount > maxVotes) {
                maxVotes = election.candidates[i].voteCount;
                winningCandidateId = i;
            }
        }
        return winningCandidateId;
    }

    function getElectionDetails(uint256 electionId)
        public
        view
        returns (
            string memory title,
            bool isActive,
            uint256 endTime,
            uint256 candidateCount
        )
    {
        Election storage election = elections[electionId];
        return (election.title, election.isActive, election.endTime, election.candidateCount);
    }

    function getCandidateDetails(uint256 electionId, uint256 candidateId)
        public
        view
        returns (string memory name, uint256 voteCount)
    {
        Candidate storage candidate = elections[electionId].candidates[candidateId];
        return (candidate.name, candidate.voteCount);
    }

    function hasVoted(uint256 electionId, address voter) public view returns (bool) {
        return elections[electionId].voters[voter].hasVoted;
    }
}