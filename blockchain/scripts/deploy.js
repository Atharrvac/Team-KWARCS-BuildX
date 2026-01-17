const hre = require("hardhat");

async function main() {
  console.log("Deploying ForwardContract...");

  const ForwardContract = await hre.ethers.getContractFactory("ForwardContract");
  const contract = await ForwardContract.deploy();

  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log(`ForwardContract deployed to: ${address}`);
  
  console.log("\nAdd this to your .env file:");
  console.log(`EXPO_PUBLIC_CONTRACT_ADDRESS=${address}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
