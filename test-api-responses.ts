/**
 * Test script to verify API error handling returns JSON (not HTML)
 * Run with: npx ts-node test-api-responses.ts
 */

async function testAPI() {
  const baseUrl = process.env.API_URL || "http://localhost:8081";
  
  console.log("🧪 Testing API error handling...");
  console.log("📍 Base URL:", baseUrl);
  console.log("");

  try {
    // Test 1: Invalid JSON
    console.log("Test 1: Invalid JSON (should return 400 JSON)");
    const test1 = await fetch(`${baseUrl}/api/sheets/create-or-update`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "invalid json{",
    });
    const test1Data = await test1.json();
    console.log("✅ Status:", test1.status);
    console.log("✅ Response is JSON:", typeof test1Data === "object");
    console.log("✅ Response:", test1Data);
    console.log("");

    // Test 2: Valid request format but missing cadastroId (should return 400 JSON from route)
    console.log("Test 2: Missing cadastroId (should return 400 JSON)");
    const test2 = await fetch(`${baseUrl}/api/sheets/create-or-update`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome: "test" }),
    });
    const test2Data = await test2.json();
    console.log("✅ Status:", test2.status);
    console.log("✅ Response is JSON:", typeof test2Data === "object");
    console.log("✅ Response:", test2Data);
    console.log("");

    // Test 3: /api/health (should work)
    console.log("Test 3: Health check (should work)");
    const test3 = await fetch(`${baseUrl}/api/health`);
    const test3Data = await test3.json();
    console.log("✅ Status:", test3.status);
    console.log("✅ Response:", test3Data);
    console.log("");

    // Test 4: Non-existent route (should return 404 JSON)
    console.log("Test 4: Non-existent route (should return 404 JSON)");
    const test4 = await fetch(`${baseUrl}/api/nonexistent`);
    const test4Data = await test4.json();
    console.log("✅ Status:", test4.status);
    console.log("✅ Response is JSON:", typeof test4Data === "object");
    console.log("✅ Response:", test4Data);
    console.log("");

    console.log("✨ All tests completed!");
  } catch (error) {
    console.error("❌ Test failed:", error);
  }
}

testAPI();
