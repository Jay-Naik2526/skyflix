const axios = require("axios");
require("dotenv").config();

const runDebug = async () => {
  const apiKey = process.env.RPMSHARE_API_KEY;
  console.log("🔑 API Key Loaded:", apiKey ? "YES (Hidden)" : "NO ❌");

  if (!apiKey) {
    console.error("❌ ERROR: Please check your .env file.");
    return;
  }

  try {
    console.log("🔄 Connecting to RPMShare API...");
    
    // We are hitting the video manager endpoint
    const url = `https://rpmshare.com/api/v1/video/manage?perPage=5`; // Get just 5 items for testing
    
    const config = {
      headers: {
        'api-token': apiKey,
        'Accept': 'application/json'
      }
    };

    const response = await axios.get(url, config);

    console.log("\n✅ API RESPONSE STATUS:", response.status);
    console.log("👇 FULL DATA DUMP (First Item Only) 👇");
    
    if (response.data.data && response.data.data.length > 0) {
        // Print the ENTIRE object for the first video found
        console.log(JSON.stringify(response.data.data[0], null, 2));
    } else {
        console.log("⚠️ API returned 0 videos. Response body:", response.data);
    }
    console.log("👆 END DATA DUMP 👆\n");

  } catch (error) {
    console.error("\n❌ API REQUEST FAILED");
    console.error("Status:", error.response ? error.response.status : "Unknown");
    console.error("Reason:", error.response ? error.response.data : error.message);
  }
};

runDebug();