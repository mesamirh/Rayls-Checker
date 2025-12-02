const fs = require("fs");
const axios = require("axios");
const { ethers } = require("ethers");
const colors = require("colors");
const readline = require("readline");

// ---------------- CONFIGURATION ----------------
const CONFIG = {
  API_BASE_URL: "https://acs-v4.clique.tech",
  APP_ID: "rayls",
  DEPLOYMENT: "Distributor",
  INPUT_FILE: "wallet.txt",
};
// -----------------------------------------------

// User Input Interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function askQuestion(query) {
  return new Promise((resolve) => rl.question(query, resolve));
}

async function checkAddress(address, index, totalWallets) {
  try {
    const payload = {
      appId: CONFIG.APP_ID,
      deployment: CONFIG.DEPLOYMENT,
      address: address.toLowerCase(),
    };

    const response = await axios.post(
      `${CONFIG.API_BASE_URL}/allocations`,
      payload,
      {
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "Mozilla/5.0",
        },
      }
    );

    const allocations = response.data.data || [];
    const progress = `[${index + 1}/${totalWallets}]`.gray;

    if (allocations.length > 0) {
      let totalAmount = BigInt(0);
      allocations.forEach((batch) => {
        totalAmount += BigInt(batch.allocation || 0);
      });
      const formatted = ethers.formatEther(totalAmount);

      console.log(
        `${progress} ${address} : ${"✅ ELIGIBLE".green.bold} | ${
          formatted.yellow
        } RLS`
      );
      fs.appendFileSync("eligible.txt", `${address} : ${formatted} RLS\n`);
    } else {
      console.log(`${progress} ${address} : ${"❌ Not Eligible".red}`);
    }
  } catch (error) {
    console.log(`[Error] ${address} : ${error.message}`.yellow);
  }
}

async function run() {
  console.clear();
  console.log("Rayls Airdrop Checker".cyan.bold);
  console.log("---------------------");

  // --- CLI PROMPT ---
  console.log("What is inside your wallet.txt file?");
  console.log("1. Public Addresses (starts with 0x...)".blue);
  console.log("2. Private Keys (64 characters)".magenta);

  const answer = await askQuestion("\nType 1 or 2 and press Enter: ".yellow);

  let isPrivateKeyMode = false;

  if (answer.trim() === "2") {
    isPrivateKeyMode = true;
    console.log("\n[Mode Selected] Reading PRIVATE KEYS...".magenta.bold);
  } else if (answer.trim() === "1") {
    console.log("\n[Mode Selected] Reading PUBLIC ADDRESSES...".blue.bold);
  } else {
    console.log("\nInvalid selection. Exiting.".red);
    process.exit(1);
  }
  // ------------------

  try {
    const data = fs.readFileSync(CONFIG.INPUT_FILE, "utf8");
    const lines = data.split(/\r?\n/).filter((line) => line.trim() !== "");

    console.log(`Loaded ${lines.length} lines. Processing...`.white);
    console.log("---------------------------------------------------");

    for (let i = 0; i < lines.length; i++) {
      let line = lines[i].trim();
      let addressToCheck = null;

      if (isPrivateKeyMode) {
        try {
          // Convert Private Key to Address
          if (!line.startsWith("0x")) line = "0x" + line;
          const wallet = new ethers.Wallet(line);
          addressToCheck = wallet.address;
        } catch (e) {
          console.log(`[${i + 1}] Invalid Private Key. Skipping.`.red);
          continue;
        }
      } else {
        // Validate Public Address
        if (ethers.isAddress(line)) {
          addressToCheck = line;
        } else {
          console.log(`[${i + 1}] Invalid Address format. Skipping.`.red);
          continue;
        }
      }

      // Run the check
      await checkAddress(addressToCheck, i, lines.length);

      // Short delay
      await new Promise((r) => setTimeout(r, 200));
    }

    console.log("---------------------------------------------------");
    console.log("Done. Results saved to eligible.txt".cyan.bold);
  } catch (err) {
    console.error("Error: wallet.txt not found.".red);
  } finally {
    rl.close();
  }
}

run();
