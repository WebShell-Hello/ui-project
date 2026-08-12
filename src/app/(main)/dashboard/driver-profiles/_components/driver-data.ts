export const driverStatuses = ["active", "on_leave", "inactive"] as const;
export const employmentTypes = ["employee", "contractor", "agency"] as const;
export const complianceStatuses = ["compliant", "action_required", "expired"] as const;

export type DriverStatus = (typeof driverStatuses)[number];
export type EmploymentType = (typeof employmentTypes)[number];
export type ComplianceStatus = (typeof complianceStatuses)[number];

export interface DriverRecord {
  id: string;
  firstName: string;
  lastName: string;
  preferredName: string;
  dateOfBirth: string;
  phone: string;
  email: string;
  address: string;
  postcode: string;
  employmentType: EmploymentType;
  jobTitle: string;
  status: DriverStatus;
  startDate: string;
  endDate: string;
  depot: string;
  manager: string;
  licenceNumber: string;
  licenceCategories: string;
  licenceExpiry: string;
  licencePoints: number;
  vehicleId: string;
  vehicleRegistration: string;
  vehicleAssignedDate: string;
  rightToWorkExpiry: string;
  dbsExpiry: string;
  medicalExpiry: string;
  complianceStatus: ComplianceStatus;
  emergencyContactName: string;
  emergencyContactRelationship: string;
  emergencyContactPhone: string;
  usualRoute: string;
  shiftPattern: string;
  payrollReference: string;
  notes: string;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
  deletedAt: string | null;
  deletedBy: string;
}

export function getDriverDisplayName(driver: DriverRecord) {
  return driver.preferredName || `${driver.firstName} ${driver.lastName}`;
}

const driverNames = [
  ["Emma", "Smith"],
  ["Noah", "Pierre"],
  ["Oliver", "Jones"],
  ["Amelia", "Brown"],
  ["George", "Wilson"],
  ["Isla", "Taylor"],
  ["Harry", "Davies"],
  ["Ava", "Evans"],
  ["Jack", "Thomas"],
  ["Mia", "Roberts"],
  ["Leo", "Johnson"],
  ["Sophia", "Walker"],
  ["Arthur", "Wright"],
  ["Lily", "Thompson"],
  ["Oscar", "White"],
  ["Grace", "Hughes"],
  ["Muhammad", "Khan"],
  ["Emily", "Edwards"],
  ["Charlie", "Green"],
  ["Freya", "Hall"],
  ["Theo", "Lewis"],
  ["Sophie", "Harris"],
  ["Alfie", "Clarke"],
  ["Evie", "Patel"],
  ["Henry", "Jackson"],
  ["Ella", "Wood"],
  ["Archie", "Turner"],
  ["Poppy", "Martin"],
  ["Finley", "Cooper"],
  ["Charlotte", "Hill"],
  ["Thomas", "Ward"],
  ["Daisy", "Morris"],
  ["Lucas", "Moore"],
  ["Phoebe", "Clark"],
  ["Isaac", "Lee"],
  ["Ruby", "King"],
  ["Ethan", "Baker"],
  ["Alice", "Harrison"],
  ["Logan", "Morgan"],
  ["Florence", "Allen"],
  ["Jacob", "James"],
  ["Sienna", "Scott"],
  ["Daniel", "Young"],
  ["Willow", "Watson"],
  ["Adam", "Mitchell"],
  ["Esme", "Carter"],
  ["Joseph", "Phillips"],
  ["Matilda", "Campbell"],
  ["Samuel", "Parker"],
  ["Hannah", "Collins"],
] as const;

export const driverTestData: DriverRecord[] = driverNames.map(([firstName, lastName], index) => {
  const number = index + 1;
  const year = 2024 + (index % 3);
  const status = driverStatuses[index % driverStatuses.length];
  const complianceStatus = complianceStatuses[index % complianceStatuses.length];

  return {
    id: `DRV-${String(number).padStart(4, "0")}`,
    firstName,
    lastName,
    preferredName: index % 4 === 0 ? firstName : "",
    dateOfBirth: `${1984 + (index % 15)}-${String((index % 9) + 1).padStart(2, "0")}-12`,
    phone: `+44 7700 900${String(100 + number).slice(-3)}`,
    email: `${firstName}.${lastName}${number}@example.com`.toLowerCase(),
    address: `${10 + number} King Street, London`,
    postcode: `E${(index % 9) + 1} 4AA`,
    employmentType: employmentTypes[index % employmentTypes.length],
    jobTitle: index % 4 === 0 ? "Lead Driver" : "Delivery Driver",
    status,
    startDate: `${year}-${String((index % 9) + 1).padStart(2, "0")}-01`,
    endDate: status === "inactive" ? `2026-07-${String((index % 20) + 1).padStart(2, "0")}` : "",
    depot: ["London Central", "Croydon", "Dartford", "Watford"][index % 4],
    manager: ["Aisha Rahman", "Daniel Carter", "Sophie Green"][index % 3],
    licenceNumber: `SMITH${String(700000 + number)}`,
    licenceCategories: index % 3 === 0 ? "B, C1" : "B",
    licenceExpiry: `${2026 + (index % 3)}-${String((index % 9) + 1).padStart(2, "0")}-18`,
    licencePoints: index % 5 === 0 ? 3 : 0,
    vehicleId: `VEH-${String(100 + number)}`,
    vehicleRegistration: `LX${20 + (index % 6)} ABC`,
    vehicleAssignedDate: `2026-${String((index % 7) + 1).padStart(2, "0")}-01`,
    rightToWorkExpiry: `2027-${String((index % 9) + 1).padStart(2, "0")}-15`,
    dbsExpiry: `2026-${String((index % 9) + 1).padStart(2, "0")}-22`,
    medicalExpiry: `2027-${String((index % 9) + 1).padStart(2, "0")}-10`,
    complianceStatus,
    emergencyContactName: `${["Alex", "Jamie", "Morgan", "Taylor"][index % 4]} ${lastName}`,
    emergencyContactRelationship: ["Partner", "Parent", "Sibling"][index % 3],
    emergencyContactPhone: `+44 7700 800${String(100 + number).slice(-3)}`,
    usualRoute: `Route ${String.fromCharCode(65 + (index % 8))}-${number}`,
    shiftPattern: index % 2 === 0 ? "Mon–Fri, 07:00–16:00" : "Tue–Sat, 08:00–17:00",
    payrollReference: `PAY-${String(8000 + number)}`,
    notes: index % 3 === 0 ? "Prefers early routes. Forklift trained." : "",
    createdAt: `${year}-01-02T09:00:00Z`,
    createdBy: "Joe",
    updatedAt: `2026-08-${String((index % 6) + 1).padStart(2, "0")}T14:30:00Z`,
    updatedBy: index % 2 === 0 ? "Joe" : "Mehmet",
    deletedAt: null,
    deletedBy: "",
  };
});

export function createEmptyDriver(sequence: number): DriverRecord {
  const timestamp = new Date().toISOString();

  return {
    id: `DRV-${String(sequence).padStart(4, "0")}`,
    firstName: "",
    lastName: "",
    preferredName: "",
    dateOfBirth: "",
    phone: "",
    email: "",
    address: "",
    postcode: "",
    employmentType: "employee",
    jobTitle: "Delivery Driver",
    status: "active",
    startDate: "",
    endDate: "",
    depot: "",
    manager: "",
    licenceNumber: "",
    licenceCategories: "B",
    licenceExpiry: "",
    licencePoints: 0,
    vehicleId: "",
    vehicleRegistration: "",
    vehicleAssignedDate: "",
    rightToWorkExpiry: "",
    dbsExpiry: "",
    medicalExpiry: "",
    complianceStatus: "action_required",
    emergencyContactName: "",
    emergencyContactRelationship: "",
    emergencyContactPhone: "",
    usualRoute: "",
    shiftPattern: "",
    payrollReference: "",
    notes: "",
    createdAt: timestamp,
    createdBy: "Current user",
    updatedAt: timestamp,
    updatedBy: "Current user",
    deletedAt: null,
    deletedBy: "",
  };
}
