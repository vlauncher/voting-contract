const hre = require("hardhat");

async function main() {
  const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3"; // Replace with deployed contract address
  const [owner, voter1, voter2] = await hre.ethers.getSigners();

  const VotingSystem = await hre.ethers.getContractFactory("VotingSystem");
  const votingSystem = await VotingSystem.attach(contractAddress);

  // Create an election
  console.log("Creating an election...");
  const duration = 7 * 24 * 60 * 60; // 7 days in seconds
  const createTx = await votingSystem.createElection("Mayor Election", duration);
  await createTx.wait();
  console.log("Election created with ID 1");

  // Add candidates
  console.log("Adding candidates...");
  await votingSystem.addCandidate(1, "Alice");
  await votingSystem.addCandidate(1, "Bob");
  console.log("Candidates Alice and Bob added");

  // Cast votes
  console.log("Casting votes...");
  await votingSystem.connect(voter1).vote(1, 1); // Voter1 votes for Alice
  await votingSystem.connect(voter2).vote(1, 2); // Voter2 votes for Bob
  console.log("Votes cast");

  // Fast-forward time to end election
  console.log("Fast-forwarding time...");
  await hre.ethers.provider.send("evm_increaseTime", [duration + 1]);
  await hre.ethers.provider.send("evm_mine");

  // End election
  console.log("Ending election...");
  const endTx = await votingSystem.endElection(1);
  await endTx.wait();
  console.log("Election ended");

  // Get winner
  const winnerId = await votingSystem.getWinningCandidate(1);
  console.log("Winning candidate ID:", winnerId.toString());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });