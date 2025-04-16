const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("VotingSystem Contract", function () {
  let VotingSystem, votingSystem, owner, voter1, voter2;
  const ELECTION_TITLE = "Mayor Election";
  const DURATION = 7 * 24 * 60 * 60; // 7 days

  beforeEach(async function () {
    [owner, voter1, voter2] = await ethers.getSigners();
    VotingSystem = await ethers.getContractFactory("VotingSystem");
    votingSystem = await VotingSystem.deploy();
    await votingSystem.waitForDeployment();

    // Create an election
    await votingSystem.createElection(ELECTION_TITLE, DURATION);
  });

  it("Should create an election", async function () {
    const [title, isActive, endTime, candidateCount] = await votingSystem.getElectionDetails(1);
    expect(title).to.equal(ELECTION_TITLE);
    expect(isActive).to.be.true;
    expect(candidateCount).to.equal(0);
  });

  it("Should add candidates", async function () {
    await votingSystem.addCandidate(1, "Alice");
    const [name, voteCount] = await votingSystem.getCandidateDetails(1, 1);
    expect(name).to.equal("Alice");
    expect(voteCount).to.equal(0);
  });

  it("Should allow voting", async function () {
    await votingSystem.addCandidate(1, "Alice");
    await votingSystem.connect(voter1).vote(1, 1);
    expect(await votingSystem.hasVoted(1, voter1.address)).to.be.true;
    const [, voteCount] = await votingSystem.getCandidateDetails(1, 1);
    expect(voteCount).to.equal(1);
  });

  it("Should prevent double voting", async function () {
    await votingSystem.addCandidate(1, "Alice");
    await votingSystem.connect(voter1).vote(1, 1);
    await expect(votingSystem.connect(voter1).vote(1, 1)).to.be.revertedWith("Already voted");
  });

  it("Should prevent voting for invalid candidate", async function () {
    await expect(votingSystem.connect(voter1).vote(1, 1)).to.be.revertedWith("Invalid candidate");
  });

  it("Should end election and determine winner", async function () {
    await votingSystem.addCandidate(1, "Alice");
    await votingSystem.addCandidate(1, "Bob");
    await votingSystem.connect(voter1).vote(1, 1); // Alice
    await votingSystem.connect(voter2).vote(1, 1); // Alice
    await ethers.provider.send("evm_increaseTime", [DURATION + 1]);
    await ethers.provider.send("evm_mine");
    await votingSystem.endElection(1);
    const winnerId = await votingSystem.getWinningCandidate(1);
    expect(winnerId).to.equal(1); // Alice wins
  });

  it("Should prevent ending active election early", async function () {
    await expect(votingSystem.endElection(1)).to.be.revertedWith("Election not ended yet");
  });

  it("Should return election details", async function () {
    const [title, isActive, , candidateCount] = await votingSystem.getElectionDetails(1);
    expect(title).to.equal(ELECTION_TITLE);
    expect(isActive).to.be.true;
    expect(candidateCount).to.equal(0);
  });

  it("Should return candidate details", async function () {
    await votingSystem.addCandidate(1, "Alice");
    await votingSystem.connect(voter1).vote(1, 1);
    const [name, voteCount] = await votingSystem.getCandidateDetails(1, 1);
    expect(name).to.equal("Alice");
    expect(voteCount).to.equal(1);
  });

  it("Should correctly track voter status", async function () {
    await votingSystem.addCandidate(1, "Alice");
    expect(await votingSystem.hasVoted(1, voter1.address)).to.be.false;
    await votingSystem.connect(voter1).vote(1, 1);
    expect(await votingSystem.hasVoted(1, voter1.address)).to.be.true;
  });
});