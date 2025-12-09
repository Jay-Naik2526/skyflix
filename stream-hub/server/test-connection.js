const axios = require("axios");
const https = require("https"); // Import HTTPS module
require("dotenv").config();

const API_KEY = process.env.TMDB_API_KEY;

console.log("---------------------------------------------------");
console.log("🛠️  CONNECTION TESTER (IPv4 FORCED)");
console.log("---------------------------------------------------");

if (!API_KEY) {
  console.error("❌ ERROR: TMDB_API_KEY is missing!");
  process.exit(1);
}

const testConnection = async () => {
  console.log("🔄 Attempting to contact TMDB...");
  
  try {
    // Force IPv4 using a custom HTTPS Agent
    const agent = new https.Agent({ family: 4 });

    const url = `https://api.themoviedb.org/3/movie/24428?api_key=${API_KEY}`;
    
    // Pass the agent to axios
    const response = await axios.get(url, { 
      httpsAgent: agent, 
      timeout: 10000 // Wait 10 seconds before failing
    });
    
    if (response.status === 200) {
      console.log("✅ SUCCESS! Connected to TMDB.");
      console.log("   Movie Found:", response.data.title);
      console.log("---------------------------------------------------");
    }
  } catch (error) {
    console.log("❌ CONNECTION FAILED");
    if (error.code === 'ETIMEDOUT') {
      console.log("💡 REASON: The request took too long. Your ISP is blocking the traffic.");
      console.log("👉 FIX: You MUST use a VPN (like ProtonVPN or Cloudflare WARP) while developing.");
    } else {
      console.log(`   Error: ${error.message}`);
    }
  }
};

testConnection();