
const BASE_URL = "http://localhost:3000/api";
let currentVehicleId = null;
let currentDriverId = null;
let currentMaintenanceId = null;
let currentExpenseId = null;

async function runTests() {
  console.log("=========================================");
  console.log("🚀 STARTING CRUD API VERIFICATION");
  console.log("=========================================\n");

  try {
    // ----------------------------------------------------
    // VEHICLE CRUD
    // ----------------------------------------------------
    console.log("1️⃣  Testing Vehicle CRUD...");

    // Create
    let res = await fetch(`${BASE_URL}/vehicles`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fleetCode: `TEST-V-${Date.now()}`,
        registrationNo: `REG-${Date.now()}`,
        manufacturer: "Test Motors",
        model: "Test Model",
        type: "VAN",
        maxLoadKg: 1000,
        odometer: 0,
        acquisitionCost: 20000,
        status: "AVAILABLE",
      }),
    });
    if (!res.ok) throw new Error(`Vehicle Create failed: ${await res.text()}`);
    let vehicle = await res.json();
    currentVehicleId = vehicle.id;
    console.log("✅ Vehicle Created");

    // Read List
    res = await fetch(`${BASE_URL}/vehicles`);
    if (!res.ok) throw new Error("Vehicle List failed");
    console.log("✅ Vehicle List working");

    // Read Single
    res = await fetch(`${BASE_URL}/vehicles/${currentVehicleId}`);
    if (!res.ok) throw new Error("Vehicle Get Single failed");
    console.log("✅ Vehicle Get Single working");

    // Update
    res = await fetch(`${BASE_URL}/vehicles/${currentVehicleId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ odometer: 10 }),
    });
    if (!res.ok) throw new Error("Vehicle Update failed");
    console.log("✅ Vehicle Update working\n");

    // ----------------------------------------------------
    // DRIVER CRUD
    // ----------------------------------------------------
    console.log("2️⃣  Testing Driver CRUD...");

    // Create
    res = await fetch(`${BASE_URL}/drivers`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test Driver",
        licenseNumber: `DL-${Date.now()}`,
        licenseCategory: "Class A",
        licenseExpiry: new Date(Date.now() + 86400000 * 365).toISOString(),
        contactNumber: "555-0000",
        safetyScore: 100,
        status: "AVAILABLE",
      }),
    });
    if (!res.ok) throw new Error(`Driver Create failed: ${await res.text()}`);
    let driver = await res.json();
    currentDriverId = driver.id;
    console.log("✅ Driver Created");

    // Read List
    res = await fetch(`${BASE_URL}/drivers`);
    if (!res.ok) throw new Error("Driver List failed");
    console.log("✅ Driver List working");

    // Update
    res = await fetch(`${BASE_URL}/drivers/${currentDriverId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ safetyScore: 99 }),
    });
    if (!res.ok) throw new Error(`Driver Update failed: ${await res.text()}`);
    console.log("✅ Driver Update working\n");

    // ----------------------------------------------------
    // MAINTENANCE CRUD & BUSINESS RULES
    // ----------------------------------------------------
    console.log("3️⃣  Testing Maintenance CRUD & Business Rules...");

    // Create ACTIVE maintenance
    res = await fetch(`${BASE_URL}/maintenance`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        vehicleId: currentVehicleId,
        serviceType: "Oil Change",
        cost: 100,
        startedAt: new Date().toISOString(),
        status: "ACTIVE",
      }),
    });
    if (!res.ok) throw new Error(`Maintenance Create failed: ${await res.text()}`);
    let maintenance = await res.json();
    currentMaintenanceId = maintenance.id;
    console.log("✅ Maintenance Created (ACTIVE)");

    // Verify Vehicle Status changed to IN_SHOP
    res = await fetch(`${BASE_URL}/vehicles/${currentVehicleId}`);
    vehicle = await res.json();
    if (vehicle.status !== "IN_SHOP") {
      throw new Error(`Business Rule Failed: Vehicle status is ${vehicle.status}, expected IN_SHOP`);
    }
    console.log("✅ Business Rule: Vehicle changed to IN_SHOP");

    // Update to COMPLETED
    res = await fetch(`${BASE_URL}/maintenance/${currentMaintenanceId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: "COMPLETED",
        completedAt: new Date().toISOString(),
      }),
    });
    if (!res.ok) throw new Error("Maintenance Update failed");
    console.log("✅ Maintenance Updated to COMPLETED");

    // Verify Vehicle Status changed back to AVAILABLE
    res = await fetch(`${BASE_URL}/vehicles/${currentVehicleId}`);
    vehicle = await res.json();
    if (vehicle.status !== "AVAILABLE") {
      throw new Error(`Business Rule Failed: Vehicle status is ${vehicle.status}, expected AVAILABLE`);
    }
    console.log("✅ Business Rule: Vehicle changed to AVAILABLE\n");

    // ----------------------------------------------------
    // EXPENSE CRUD
    // ----------------------------------------------------
    console.log("4️⃣  Testing Expense CRUD...");

    // Create
    res = await fetch(`${BASE_URL}/expenses`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        vehicleId: currentVehicleId,
        category: "MAINTENANCE",
        amount: 100,
        description: "Oil Change Expense",
        recordedAt: new Date().toISOString(),
      }),
    });
    if (!res.ok) throw new Error(`Expense Create failed: ${await res.text()}`);
    let expense = await res.json();
    currentExpenseId = expense.id;
    console.log("✅ Expense Created");

    // Read List
    res = await fetch(`${BASE_URL}/expenses`);
    if (!res.ok) throw new Error("Expense List failed");
    console.log("✅ Expense List working");

    // Update
    res = await fetch(`${BASE_URL}/expenses/${currentExpenseId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: 150 }),
    });
    if (!res.ok) throw new Error("Expense Update failed");
    console.log("✅ Expense Update working\n");

    // ----------------------------------------------------
    // CLEANUP / DELETE OPERATIONS
    // ----------------------------------------------------
    console.log("🧹 Testing Delete Operations & Cleanup...");

    // Delete Expense
    res = await fetch(`${BASE_URL}/expenses/${currentExpenseId}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Expense Delete failed");
    console.log("✅ Expense Deleted");

    // Delete Maintenance
    res = await fetch(`${BASE_URL}/maintenance/${currentMaintenanceId}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Maintenance Delete failed");
    console.log("✅ Maintenance Deleted");

    // Delete Driver
    res = await fetch(`${BASE_URL}/drivers/${currentDriverId}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Driver Delete failed");
    console.log("✅ Driver Deleted");

    // Delete Vehicle
    res = await fetch(`${BASE_URL}/vehicles/${currentVehicleId}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Vehicle Delete failed");
    console.log("✅ Vehicle Deleted");

    console.log("\n🎉 ALL CRUD OPERATIONS & BUSINESS RULES VERIFIED SUCCESSFULLY!");
  } catch (err) {
    console.error("\n❌ TEST FAILED:");
    console.error(err.message);
    process.exit(1);
  }
}

runTests();
