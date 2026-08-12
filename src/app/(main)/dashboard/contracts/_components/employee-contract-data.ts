export const employeeContractTypes = ["permanent", "fixed_term", "part_time"] as const;
export const employeeContractStatuses = ["active", "upcoming", "expired"] as const;

export type EmployeeContractType = (typeof employeeContractTypes)[number];
export type EmployeeContractStatus = (typeof employeeContractStatuses)[number];

export interface EmployeeContractRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  jobTitle: string;
  contractType: EmployeeContractType;
  startDate: string;
  endDate: string | null;
  annualSalary: number;
  fileName: string;
}

const employeeContractSeeds: Omit<EmployeeContractRecord, "id" | "fileName">[] = [
  {
    employeeId: "EMP-0001",
    employeeName: "Emma Smith",
    jobTitle: "Lead Driver",
    contractType: "permanent",
    startDate: "2024-02-12",
    endDate: null,
    annualSalary: 38_000,
  },
  {
    employeeId: "EMP-0002",
    employeeName: "Noah Pierre",
    jobTitle: "Delivery Driver",
    contractType: "permanent",
    startDate: "2025-05-19",
    endDate: null,
    annualSalary: 32_500,
  },
  {
    employeeId: "EMP-0003",
    employeeName: "Oliver Jones",
    jobTitle: "Fleet Coordinator",
    contractType: "fixed_term",
    startDate: "2025-09-01",
    endDate: "2026-08-31",
    annualSalary: 35_000,
  },
  {
    employeeId: "EMP-0004",
    employeeName: "Amelia Brown",
    jobTitle: "Payroll Administrator",
    contractType: "part_time",
    startDate: "2025-11-10",
    endDate: null,
    annualSalary: 24_000,
  },
  {
    employeeId: "EMP-0005",
    employeeName: "George Wilson",
    jobTitle: "Delivery Driver",
    contractType: "fixed_term",
    startDate: "2026-01-05",
    endDate: "2026-12-31",
    annualSalary: 31_500,
  },
  {
    employeeId: "EMP-0006",
    employeeName: "Isla Taylor",
    jobTitle: "Operations Analyst",
    contractType: "permanent",
    startDate: "2026-02-16",
    endDate: null,
    annualSalary: 37_500,
  },
  {
    employeeId: "EMP-0007",
    employeeName: "Harry Davies",
    jobTitle: "Warehouse Operative",
    contractType: "part_time",
    startDate: "2026-03-02",
    endDate: null,
    annualSalary: 22_500,
  },
  {
    employeeId: "EMP-0008",
    employeeName: "Ava Evans",
    jobTitle: "HR Coordinator",
    contractType: "permanent",
    startDate: "2026-03-23",
    endDate: null,
    annualSalary: 34_000,
  },
  {
    employeeId: "EMP-0009",
    employeeName: "Jack Thomas",
    jobTitle: "Delivery Driver",
    contractType: "fixed_term",
    startDate: "2026-04-06",
    endDate: "2027-04-05",
    annualSalary: 31_500,
  },
  {
    employeeId: "EMP-0010",
    employeeName: "Mia Roberts",
    jobTitle: "Customer Service Advisor",
    contractType: "part_time",
    startDate: "2026-05-11",
    endDate: null,
    annualSalary: 23_500,
  },
  {
    employeeId: "EMP-0011",
    employeeName: "Leo Johnson",
    jobTitle: "Route Planner",
    contractType: "permanent",
    startDate: "2026-06-01",
    endDate: null,
    annualSalary: 36_000,
  },
  {
    employeeId: "EMP-0012",
    employeeName: "Sophia Walker",
    jobTitle: "Compliance Officer",
    contractType: "fixed_term",
    startDate: "2026-07-13",
    endDate: "2027-07-12",
    annualSalary: 39_000,
  },
  {
    employeeId: "EMP-0013",
    employeeName: "Arthur Wright",
    jobTitle: "Delivery Driver",
    contractType: "permanent",
    startDate: "2026-08-03",
    endDate: null,
    annualSalary: 32_500,
  },
  {
    employeeId: "EMP-0014",
    employeeName: "Lily Thompson",
    jobTitle: "Finance Assistant",
    contractType: "fixed_term",
    startDate: "2026-09-01",
    endDate: "2027-08-31",
    annualSalary: 30_000,
  },
  {
    employeeId: "EMP-0015",
    employeeName: "Oscar White",
    jobTitle: "Warehouse Operative",
    contractType: "fixed_term",
    startDate: "2025-01-06",
    endDate: "2026-07-31",
    annualSalary: 29_000,
  },
];

export const employeeContractTestData: EmployeeContractRecord[] = employeeContractSeeds
  .map((contract, index) => {
    const sequence = String(index + 1).padStart(4, "0");

    return {
      ...contract,
      id: `ECT-${sequence}`,
      fileName: `${contract.employeeId.toLowerCase()}-employment-contract.pdf`,
    };
  })
  .sort((firstContract, secondContract) =>
    secondContract.startDate.localeCompare(firstContract.startDate),
  );

const demoDate = "2026-08-12";

export function getEmployeeContractStatus(
  contract: EmployeeContractRecord,
): EmployeeContractStatus {
  if (contract.startDate > demoDate) {
    return "upcoming";
  }

  if (contract.endDate && contract.endDate < demoDate) {
    return "expired";
  }

  return "active";
}
