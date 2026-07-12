import "dotenv/config";

import {
  PrismaClient,
  VehicleType,
  VehicleStatus,
  DriverStatus,
  TripStatus,
  MaintenanceStatus,
  ExpenseCategory,
  ApplicationRole,
} from "@prisma/client";

import { PrismaNeon } from "@prisma/adapter-neon";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not defined.");
}

const adapter = new PrismaNeon({
  connectionString,
});

const prisma = new PrismaClient({
  adapter,
});

// --- Helper Functions ---
const randomItem = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

const randomNumber = (min: number, max: number): number => Math.floor(Math.random() * (max - min + 1)) + min;

const randomFloat = (min: number, max: number): number => parseFloat((Math.random() * (max - min) + min).toFixed(2));

const randomDate = (start: Date, end: Date): Date => new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));

const randomEnum = <T extends object>(anEnum: T): T[keyof T] => {
  const enumValues = Object.values(anEnum) as T[keyof T][];
  return randomItem(enumValues);
};

// --- Mock Data Pools ---
const CITIES = ['Mumbai', 'Delhi', 'Bengaluru', 'Hyderabad', 'Ahmedabad', 'Chennai', 'Kolkata', 'Surat', 'Pune', 'Jaipur', 'Lucknow', 'Kanpur', 'Nagpur', 'Indore', 'Thane'];
const FIRST_NAMES = ['Aarav', 'Vihaan', 'Vivaan', 'Ananya', 'Diya', 'Advik', 'Kabir', 'Anaya', 'Aarush', 'Omer', 'Riya', 'Aahil', 'Samar', 'Isha', 'Rohan', 'Amit', 'Sunil', 'Raj', 'Vikram', 'Rahul', 'Priya', 'Neha', 'Pooja', 'Kiran', 'Suresh', 'Ramesh', 'Raju'];
const LAST_NAMES = ['Sharma', 'Singh', 'Kumar', 'Patel', 'Deshmukh', 'Rao', 'Das', 'Reddy', 'Gowda', 'Nair', 'Menon', 'Yadav', 'Gupta', 'Jain', 'Mehta', 'Bose', 'Chatterjee', 'Iyer', 'Pillai', 'Chauhan'];
const MANUFACTURERS = ['Tata', 'Ashok Leyland', 'Mahindra', 'BharatBenz', 'Eicher'];
const VEHICLE_MODELS = ['Pro 2049', 'Dost+', 'Prima', 'Signa', 'Blazo', 'Furio', 'E-Comet', 'Boss', 'Bada Dost', 'Intra'];
const MAINTENANCE_TYPES = ['Oil Change', 'Brake Replacement', 'Tire Rotation', 'Engine Tune-up', 'Transmission Fluid Change', 'Battery Replacement', 'Suspension Repair', 'AC Service'];
const EXPENSE_DESCRIPTIONS = ['Regular fueling', 'Highway toll', 'Emergency repair', 'Scheduled maintenance', 'Parking fee', 'Driver allowance', 'Washing and cleaning'];

// --- Generators ---
const generateName = () => `${randomItem(FIRST_NAMES)} ${randomItem(LAST_NAMES)}`;
const generatePhoneNo = () => `+91${randomNumber(6000000000, 9999999999)}`;
const generateFleetCode = (i: number) => `FLT-${String(i).padStart(4, '0')}`;
const generateRegNo = (i: number) => `MH-${randomNumber(10, 49)}-${randomItem(['A', 'B', 'C', 'D', 'E', 'F'])}${randomItem(['A', 'B', 'C', 'D', 'E', 'F'])}-${String(i).padStart(4, '0')}`;
const generateLicenseNo = (i: number) => `DL-${randomNumber(10, 99)}-${String(i).padStart(6, '0')}`;
const generateTripNo = (i: number) => `TRP-${new Date().getFullYear()}-${String(i).padStart(5, '0')}`;

async function main() {
  console.log('Starting seed...');

  // 1. Delete existing data in dependency order
  console.log('Cleaning up existing data...');
  await prisma.$transaction([
    prisma.expense.deleteMany(),
    prisma.fuelLog.deleteMany(),
    prisma.maintenanceLog.deleteMany(),
    prisma.trip.deleteMany(),
    prisma.driver.deleteMany(),
    prisma.vehicle.deleteMany(),
    prisma.userProfile.deleteMany(),
    prisma.settings.deleteMany(),
  ]);

  // 2. Settings
  console.log('Seeding Settings...');
  await prisma.settings.create({
    data: {
      depotName: 'Central Transit Hub',
      currency: 'INR',
      distanceUnit: 'KM',
    },
  });

  // 3. UserProfile
  console.log('Seeding UserProfiles...');
  const roles = [
    ApplicationRole.UNASSIGNED,
    ApplicationRole.FLEET_MANAGER,
    ApplicationRole.DISPATCHER,
    ApplicationRole.SAFETY_OFFICER,
    ApplicationRole.FINANCIAL_ANALYST,
  ];

  const usersToCreate = [];
  for (let i = 1; i <= 10; i++) {
    usersToCreate.push({
      authUserId: `auth_${i}_${Date.now()}`,
      email: `user${i}@transitops.local`,
      name: generateName(),
      role: i <= roles.length ? roles[i - 1] : ApplicationRole.UNASSIGNED,
    });
  }
  await prisma.userProfile.createMany({ data: usersToCreate });

  // 4. Vehicle
  console.log('Seeding Vehicles...');
  const vehicles = [];
  for (let i = 1; i <= 50; i++) {
    // Distribution: 60% AVAILABLE, 20% ON_TRIP, 10% IN_SHOP, 10% RETIRED
    let status: VehicleStatus = VehicleStatus.AVAILABLE;
    if (i > 30 && i <= 40) status = VehicleStatus.ON_TRIP;
    else if (i > 40 && i <= 45) status = VehicleStatus.IN_SHOP;
    else if (i > 45) status = VehicleStatus.RETIRED;

    const v = await prisma.vehicle.create({
      data: {
        fleetCode: generateFleetCode(i),
        registrationNo: generateRegNo(i),
        manufacturer: randomItem(MANUFACTURERS),
        model: randomItem(VEHICLE_MODELS),
        type: randomEnum(VehicleType),
        maxLoadKg: randomNumber(1000, 25000),
        odometer: randomNumber(5000, 200000),
        acquisitionCost: randomNumber(800000, 5000000),
        status,
      },
    });
    vehicles.push(v);
  }

  // 5. Driver
  console.log('Seeding Drivers...');
  const drivers = [];
  for (let i = 1; i <= 50; i++) {
    // Distribution: 60% AVAILABLE, 20% ON_TRIP, 15% OFF_DUTY, 5% SUSPENDED
    let status: DriverStatus = DriverStatus.AVAILABLE;
    if (i > 30 && i <= 40) status = DriverStatus.ON_TRIP;
    else if (i > 40 && i <= 47) status = DriverStatus.OFF_DUTY;
    else if (i > 47) status = DriverStatus.SUSPENDED;

    const d = await prisma.driver.create({
      data: {
        name: generateName(),
        licenseNumber: generateLicenseNo(i),
        licenseCategory: randomItem(['LMV', 'HMV', 'HTV', 'TR']),
        licenseExpiry: randomDate(new Date(), new Date(new Date().setFullYear(new Date().getFullYear() + 5))),
        contactNumber: generatePhoneNo(),
        safetyScore: randomNumber(60, 100),
        status,
      },
    });
    drivers.push(d);
  }

  // 6. Trip
  console.log('Seeding Trips...');
  const trips = [];
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  const now = new Date();

  for (let i = 1; i <= 120; i++) {
    // Distribution: 40% COMPLETED, 20% DISPATCHED, 25% DRAFT, 15% CANCELLED
    let status: TripStatus = TripStatus.COMPLETED; // 48
    if (i > 48 && i <= 72) status = TripStatus.DISPATCHED; // 24
    else if (i > 72 && i <= 102) status = TripStatus.DRAFT; // 30
    else if (i > 102) status = TripStatus.CANCELLED; // 18

    const v = randomItem(vehicles);
    const d = randomItem(drivers);

    const startOdometer = Math.max(0, v.odometer - randomNumber(1000, 5000));
    const plannedDistance = randomNumber(50, 1500);

    const tripDate = randomDate(oneYearAgo, now);
    let dispatchedAt: Date | null = null;
    let completedAt: Date | null = null;
    let cancelledAt: Date | null = null;
    let endOdometer: number | null = null;
    let fuelConsumedL: number | null = null;
    let revenue: number | null = null;

    if (status !== TripStatus.DRAFT) {
      dispatchedAt = new Date(tripDate.getTime() + randomNumber(1, 24) * 60 * 60 * 1000);
    }
    if (status === TripStatus.COMPLETED && dispatchedAt) {
      completedAt = new Date(dispatchedAt.getTime() + randomNumber(2, 72) * 60 * 60 * 1000);
      endOdometer = startOdometer + plannedDistance + randomNumber(-20, 50);
      fuelConsumedL = randomFloat(plannedDistance / 6, plannedDistance / 3);
      revenue = randomFloat(plannedDistance * 20, plannedDistance * 50);
    }
    if (status === TripStatus.CANCELLED) {
      cancelledAt = new Date(tripDate.getTime() + randomNumber(1, 48) * 60 * 60 * 1000);
    }

    const t = await prisma.trip.create({
      data: {
        tripNumber: generateTripNo(i),
        source: randomItem(CITIES),
        destination: randomItem(CITIES),
        cargoWeightKg: randomNumber(500, v.maxLoadKg),
        plannedDistanceKm: plannedDistance,
        startOdometer,
        endOdometer,
        fuelConsumedL,
        revenue,
        status,
        dispatchedAt,
        completedAt,
        cancelledAt,
        vehicleId: v.id,
        driverId: d.id,
        createdAt: tripDate,
      },
    });
    trips.push(t);
  }

  // 7. MaintenanceLog
  console.log('Seeding MaintenanceLogs...');
  const maintenanceLogs = [];
  for (let i = 1; i <= 60; i++) {
    const v = randomItem(vehicles);
    // Mix ACTIVE, COMPLETED
    const status = randomEnum(MaintenanceStatus);
    const startedAt = randomDate(oneYearAgo, now);
    const completedAt = status === MaintenanceStatus.COMPLETED ? new Date(startedAt.getTime() + randomNumber(1, 7) * 24 * 60 * 60 * 1000) : null;

    const ml = await prisma.maintenanceLog.create({
      data: {
        serviceType: randomItem(MAINTENANCE_TYPES),
        description: randomItem(EXPENSE_DESCRIPTIONS),
        cost: randomFloat(500, 25000),
        startedAt,
        completedAt,
        status,
        vehicleId: v.id,
      },
    });
    maintenanceLogs.push(ml);

    // Business rule implementation
    if (status === MaintenanceStatus.ACTIVE) {
      await prisma.vehicle.update({
        where: { id: v.id },
        data: { status: VehicleStatus.IN_SHOP },
      });
      // update our local copy too
      v.status = VehicleStatus.IN_SHOP;
    } else if (status === MaintenanceStatus.COMPLETED && v.status !== VehicleStatus.RETIRED) {
      // Vehicle should remain AVAILABLE unless RETIRED
      await prisma.vehicle.update({
        where: { id: v.id },
        data: { status: VehicleStatus.AVAILABLE },
      });
      v.status = VehicleStatus.AVAILABLE;
    }
  }

  // 8. FuelLog
  console.log('Seeding FuelLogs...');
  for (let i = 1; i <= 150; i++) {
    const v = randomItem(vehicles);
    const tripsForVehicle = trips.filter(tr => tr.vehicleId === v.id);
    const t = tripsForVehicle.length > 0 && Math.random() > 0.5 ? randomItem(tripsForVehicle) : null;
    const liters = randomFloat(20, 200);

    await prisma.fuelLog.create({
      data: {
        liters,
        cost: liters * randomFloat(90, 105), // ~ cost per liter in INR
        loggedAt: t?.dispatchedAt ? new Date(t.dispatchedAt.getTime() + 1000 * 60 * 60) : randomDate(oneYearAgo, now),
        vehicleId: v.id,
        tripId: t?.id,
      },
    });
  }

  // 9. Expense
  console.log('Seeding Expenses...');
  for (let i = 1; i <= 200; i++) {
    const v = randomItem(vehicles);
    const category = randomEnum(ExpenseCategory);

    let tripId = null;
    let maintenanceLogId = null;

    if ((category === ExpenseCategory.FUEL || category === ExpenseCategory.TOLL) && Math.random() > 0.3) {
      const tripsForVehicle = trips.filter(tr => tr.vehicleId === v.id);
      if (tripsForVehicle.length > 0) {
        tripId = randomItem(tripsForVehicle).id;
      }
    } else if (category === ExpenseCategory.MAINTENANCE && Math.random() > 0.3) {
      const logsForVehicle = maintenanceLogs.filter(ml => ml.vehicleId === v.id);
      if (logsForVehicle.length > 0) {
        maintenanceLogId = randomItem(logsForVehicle).id;
      }
    }

    await prisma.expense.create({
      data: {
        category,
        amount: randomFloat(100, 15000),
        description: randomItem(EXPENSE_DESCRIPTIONS),
        recordedAt: randomDate(oneYearAgo, now),
        vehicleId: v.id,
        tripId,
        maintenanceLogId,
      },
    });
  }

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
