const fs = require("fs");
const axios = require("axios");
const { ethers } = require("ethers");
const colors = require("colors");

// ---------------- CONFIGURATION ----------------
const CONFIG = {
  API_BASE_URL: "https://acs-v4.clique.tech",
  APP_ID: "rayls",
  DEPLOYMENT: "Distributor",
  // File containing addresses
  INPUT_FILE: "wallet.txt",
};
// -----------------------------------------------

async function checkAddress(address, index, totalWallets) {
  // Clean the address (remove spaces)
  const cleanAddress = address.trim();

  // Skip invalid lines
  if (!cleanAddress || !cleanAddress.startsWith("0x")) {
    return;
  }

  try {
    const payload = {
      appId: CONFIG.APP_ID,
      deployment: CONFIG.DEPLOYMENT,
      address: cleanAddress.toLowerCase(),
    };

    // Call the API
    const response = await axios.post(
      `${CONFIG.API_BASE_URL}/allocations`,
      payload,
      {
        headers: {
          "Content-Type": "application/json",
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
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
        `${progress} ${cleanAddress} : ${"✅ ELIGIBLE".green.bold} | ${
          formatted.yellow
        } RLS`
      );

      // Save eligible wallets to a separate file (optional)
      fs.appendFileSync("eligible.txt", `${cleanAddress} : ${formatted} RLS\n`);
    } else {
      console.log(`${progress} ${cleanAddress} : ${"❌ Not Eligible".red}`);
    }
  } catch (error) {
    console.log(`[Error] ${cleanAddress} : ${error.message}`.yellow);
  }
}

async function run() {
  console.log("Reading wallet.txt...".cyan);

  try {
    // Read file and split by new line
    const data = fs.readFileSync(CONFIG.INPUT_FILE, "utf8");
    const wallets = data.split(/\r?\n/).filter((line) => line.trim() !== "");

    console.log(
      `Loaded ${wallets.length} wallets. Starting check...`.white.bold
    );
    console.log("---------------------------------------------------");

    for (let i = 0; i < wallets.length; i++) {
      await checkAddress(wallets[i], i, wallets.length);

      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    console.log("---------------------------------------------------");
    console.log("Done! Check 'eligible.txt' for winners.".cyan.bold);
  } catch (err) {
    console.error("Error: Could not read wallet.txt".red);
    console.error("Make sure the file exists in the same folder.");
  }
}

run();
