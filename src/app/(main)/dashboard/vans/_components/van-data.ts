export const vanStatuses = ["active", "available", "maintenance", "off_road", "returned"] as const;
export const ownershipTypes = ["company_owned", "rented"] as const;
export const fuelTypes = ["diesel", "petrol", "electric", "hybrid"] as const;
export const transmissionTypes = ["manual", "automatic"] as const;
export const motStatuses = ["valid", "failed", "pending", "exempt"] as const;
export const roadTaxStatuses = ["taxed", "due", "expired", "exempt"] as const;

export type VanStatus = (typeof vanStatuses)[number];
export type OwnershipType = (typeof ownershipTypes)[number];
export type FuelType = (typeof fuelTypes)[number];
export type TransmissionType = (typeof transmissionTypes)[number];
export type MotStatus = (typeof motStatuses)[number];
export type RoadTaxStatus = (typeof roadTaxStatuses)[number];

export interface VanRecord {
  id: string;
  registrationNumber: string;
  vin: string;
  make: string;
  model: string;
  manufactureYear: number;
  colour: string;
  fuelType: FuelType;
  transmission: TransmissionType;
  mileage: number;
  status: VanStatus;
  depot: string;
  ownershipType: OwnershipType;
  ownerName: string;
  purchaseDate: string | null;
  purchasePrice: number | null;
  rentalSupplier: string | null;
  rentalContractNumber: string | null;
  rentalStartDate: string | null;
  rentalTerminationDate: string | null;
  rentalMonthlyCost: number | null;
  currentAssigneeId: string | null;
  currentAssigneeName: string | null;
  assignmentStartDate: string | null;
  assignmentExpectedEndDate: string | null;
  motExpiryDate: string | null;
  motStatus: MotStatus;
  roadTaxExpiryDate: string | null;
  roadTaxStatus: RoadTaxStatus;
  insuranceExpiryDate: string | null;
  serviceDueDate: string | null;
  serviceDueMileage: number | null;
  lastInspectionDate: string | null;
  nextInspectionDate: string | null;
  documentCount: number;
  notes: string;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
  archivedAt: string | null;
  archivedBy: string | null;
}

const vehicleModels = [
  ["Ford", "Transit 350"],
  ["Mercedes-Benz", "Sprinter 314"],
  ["Volkswagen", "Crafter CR35"],
  ["Renault", "Master LM35"],
  ["Vauxhall", "Movano L3H2"],
  ["Peugeot", "Boxer 335"],
  ["Citroen", "Relay 35"],
  ["Fiat", "Ducato 35"],
  ["Nissan", "Interstar Tekna"],
  ["Maxus", "eDELIVER 9"],
] as const;

const driverNames = [
  "Emma Smith",
  "Noah Pierre",
  "Oliver Jones",
  "Amelia Brown",
  "George Wilson",
  "Isla Taylor",
  "Harry Davies",
  "Ava Evans",
  "Jack Thomas",
  "Mia Roberts",
  "Leo Johnson",
  "Sophia Walker",
  "Arthur Wright",
  "Lily Thompson",
  "Oscar White",
  "Grace Hughes",
  "Muhammad Khan",
  "Emily Edwards",
  "Charlie Green",
  "Freya Hall",
  "Theo Lewis",
  "Sophie Harris",
  "Alfie Clarke",
  "Evie Patel",
  "Henry Jackson",
  "Ella Wood",
  "Archie Turner",
  "Poppy Martin",
  "Finley Cooper",
  "Charlotte Hill",
  "Thomas Ward",
  "Daisy Morris",
  "Lucas Moore",
  "Phoebe Clark",
  "Isaac Lee",
  "Ruby King",
  "Ethan Baker",
  "Alice Harrison",
  "Logan Morgan",
  "Florence Allen",
  "Jacob James",
  "Sienna Scott",
  "Daniel Young",
  "Willow Watson",
  "Adam Mitchell",
  "Esme Carter",
  "Joseph Phillips",
  "Matilda Campbell",
  "Samuel Parker",
  "Hannah Collins",
] as const;

const depots = ["London Central", "Croydon", "Dartford", "Watford"] as const;
const colours = ["White", "Silver", "Black", "Grey", "Blue", "Red"] as const;
const rentalSuppliers = ["Northgate Vehicle Hire", "Enterprise Flex-E-Rent", "Fraikin UK"] as const;

const motExpiryDates = [
  "2026-07-18",
  "2026-08-25",
  "2026-10-14",
  "2027-01-22",
  "2027-05-09",
  null,
] as const;

const roadTaxExpiryDates = [
  "2026-07-31",
  "2026-08-29",
  "2026-11-30",
  "2027-02-28",
  "2027-06-30",
  null,
] as const;

function createRegistrationNumber(index: number) {
  const firstLetter = String.fromCharCode(65 + Math.floor(index / 26));
  const secondLetter = String.fromCharCode(65 + (index % 26));

  return `LK${20 + (index % 7)} ${firstLetter}${secondLetter}V`;
}

function getMotStatus(expiryDate: string | null, index: number): MotStatus {
  if (!expiryDate) return "pending";
  if (index % 17 === 0) return "failed";
  return "valid";
}

function getRoadTaxStatus(expiryDate: string | null): RoadTaxStatus {
  if (!expiryDate) return "due";
  if (expiryDate < "2026-08-12") return "expired";
  if (expiryDate <= "2026-09-11") return "due";
  return "taxed";
}

export const vanTestData: VanRecord[] = Array.from({ length: 50 }, (_, index) => {
  const number = index + 1;
  const rented = index % 5 >= 3;
  const returned = rented && index % 11 === 0;
  const status: VanStatus = returned
    ? "returned"
    : index % 13 === 0
      ? "off_road"
      : index % 9 === 0
        ? "maintenance"
        : index % 6 === 0
          ? "available"
          : "active";
  const isAssigned = status === "active";
  const [make, model] = vehicleModels[index % vehicleModels.length];
  const motExpiryDate = motExpiryDates[index % motExpiryDates.length];
  const roadTaxExpiryDate = roadTaxExpiryDates[(index + 2) % roadTaxExpiryDates.length];
  const currentAssigneeId = isAssigned ? `DRV-${String(number).padStart(4, "0")}` : null;
  const manufactureYear = 2020 + (index % 7);

  return {
    id: `VAN-${String(number).padStart(4, "0")}`,
    registrationNumber: createRegistrationNumber(index),
    vin: `WVWZZZ1JZ${String(70000000 + number)}`,
    make,
    model,
    manufactureYear,
    colour: colours[index % colours.length],
    fuelType: make === "Maxus" ? "electric" : fuelTypes[index % fuelTypes.length],
    transmission: transmissionTypes[index % transmissionTypes.length],
    mileage: 18_500 + index * 3_275,
    status,
    depot: depots[index % depots.length],
    ownershipType: rented ? "rented" : "company_owned",
    ownerName: rented ? rentalSuppliers[index % rentalSuppliers.length] : "Example Logistics Ltd",
    purchaseDate: rented ? null : `${manufactureYear}-03-${String((index % 20) + 1).padStart(2, "0")}`,
    purchasePrice: rented ? null : 24_500 + (index % 10) * 1_250,
    rentalSupplier: rented ? rentalSuppliers[index % rentalSuppliers.length] : null,
    rentalContractNumber: rented ? `RNT-${2024 + (index % 3)}-${String(number).padStart(4, "0")}` : null,
    rentalStartDate: rented ? `${2024 + (index % 2)}-${String((index % 9) + 1).padStart(2, "0")}-01` : null,
    rentalTerminationDate: rented
      ? returned
        ? "2026-07-31"
        : `${2026 + (index % 2)}-${String(((index + 4) % 12) + 1).padStart(2, "0")}-28`
      : null,
    rentalMonthlyCost: rented ? 895 + (index % 6) * 75 : null,
    currentAssigneeId,
    currentAssigneeName: isAssigned ? driverNames[index] : null,
    assignmentStartDate: isAssigned
      ? `2026-${String((index % 7) + 1).padStart(2, "0")}-${String((index % 20) + 1).padStart(2, "0")}`
      : null,
    assignmentExpectedEndDate: isAssigned && rented ? "2026-12-31" : null,
    motExpiryDate,
    motStatus: getMotStatus(motExpiryDate, index),
    roadTaxExpiryDate,
    roadTaxStatus: getRoadTaxStatus(roadTaxExpiryDate),
    insuranceExpiryDate: `2026-${String(((index + 8) % 12) + 1).padStart(2, "0")}-20`,
    serviceDueDate: `2026-${String(((index + 9) % 12) + 1).padStart(2, "0")}-15`,
    serviceDueMileage: 25_000 + index * 3_500,
    lastInspectionDate: `2026-${String((index % 7) + 1).padStart(2, "0")}-10`,
    nextInspectionDate: `2026-${String(8 + (index % 5)).padStart(2, "0")}-10`,
    documentCount: 3 + (index % 8),
    notes:
      status === "maintenance"
        ? "Scheduled maintenance in progress."
        : status === "off_road"
          ? "Vehicle held off road pending inspection."
          : returned
            ? "Rental vehicle returned to supplier."
            : "",
    createdAt: `${2024 + (index % 2)}-01-05T09:00:00Z`,
    createdBy: index % 2 === 0 ? "Joe" : "Mehmet",
    updatedAt: `2026-08-${String((index % 11) + 1).padStart(2, "0")}T14:30:00Z`,
    updatedBy: index % 3 === 0 ? "Mehmet" : "Joe",
    archivedAt: returned ? "2026-08-01T10:00:00Z" : null,
    archivedBy: returned ? "Mehmet" : null,
  };
});
