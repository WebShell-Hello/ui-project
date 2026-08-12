import { File, FileArchive, FileChartColumn, FileImage, FileText } from "lucide-react";

import { contractTestData } from "@/app/(main)/dashboard/contracts/_components/contract-data";
import { getInitials } from "@/lib/utils";

export type FileKind = "document" | "spreadsheet" | "image" | "pdf" | "archive";
export type FileManagerView = "grid" | "list";
export const unclassifiedFolderId = "unclassified";
export type FileManagerFolderId = string;

export const fileIcons = {
  archive: FileArchive,
  image: FileImage,
  document: FileText,
  pdf: File,
  spreadsheet: FileChartColumn,
} satisfies Record<FileKind, typeof File>;

export const fileKindLabels: Record<FileKind, string> = {
  archive: "Archive",
  image: "Image",
  document: "Document",
  pdf: "PDF",
  spreadsheet: "Spreadsheet",
};

export interface FileManagerFolder {
  id: FileManagerFolderId;
  name: string;
  description: string;
  fileCount: number;
  size: string;
  updatedAt: string;
  deletable: boolean;
}

export interface FileManagerFile {
  id: string;
  folderId: FileManagerFolderId;
  name: string;
  kind: FileKind;
  size: string;
  owner: string;
  ownerInitials: string;
  modifiedAt: string;
  shared: boolean;
  starred: boolean;
  contractId?: string;
}

const folderDefinitions = [
  {
    id: unclassifiedFolderId,
    name: "Unclassified",
    description: "Files waiting to be reviewed and moved into the correct folder.",
    size: "0 B",
    updatedAt: "Just now",
    deletable: false,
  },
  {
    id: "employees",
    name: "Employees",
    description: "Contracts, payslips, licences, schedules, timesheets and payroll.",
    size: "28.4 MB",
    updatedAt: "Today",
    deletable: true,
  },
  {
    id: "clients",
    name: "Clients",
    description: "Customer contracts, supporting agreements and invoices.",
    size: "18.7 MB",
    updatedAt: "Yesterday",
    deletable: true,
  },
  {
    id: "regulatory",
    name: "Regulatory",
    description: "Insurance, audits, risk assessments, certificates and incidents.",
    size: "36.1 MB",
    updatedAt: "Aug 10",
    deletable: true,
  },
  {
    id: "internal",
    name: "Internal",
    description: "Company records, licences, policies, handbooks and meeting minutes.",
    size: "22.8 MB",
    updatedAt: "Aug 08",
    deletable: true,
  },
] as const satisfies readonly Omit<FileManagerFolder, "fileCount">[];

const fileSeeds = [
  {
    id: "employment-contract-emma-smith",
    folderId: "employees",
    name: "Employment contract - Emma Smith.pdf",
    kind: "pdf",
    size: "1.8 MB",
    modifiedAt: "Today, 09:14",
  },
  {
    id: "payslip-july-2026",
    folderId: "employees",
    name: "Payslip - July 2026.pdf",
    kind: "pdf",
    size: "420 KB",
    modifiedAt: "Yesterday",
  },
  {
    id: "driving-licence-emma-smith",
    folderId: "employees",
    name: "Driving licence - Emma Smith.jpg",
    kind: "image",
    size: "2.6 MB",
    modifiedAt: "Aug 10, 2026",
  },
  {
    id: "driver-schedule-week-33",
    folderId: "employees",
    name: "Driver schedule - Week 33.xlsx",
    kind: "spreadsheet",
    size: "860 KB",
    modifiedAt: "Aug 09, 2026",
  },
  {
    id: "timesheets-payroll-july",
    folderId: "employees",
    name: "Timesheets and payroll - July 2026.xlsx",
    kind: "spreadsheet",
    size: "3.4 MB",
    modifiedAt: "Aug 06, 2026",
  },
  {
    id: "invoice-acme-2026-0812",
    folderId: "clients",
    name: "Invoice - Acme Logistics - INV-0812.pdf",
    kind: "pdf",
    size: "760 KB",
    modifiedAt: "Aug 08, 2026",
  },
  {
    id: "client-invoice-register",
    folderId: "clients",
    name: "Client invoice register - Q3 2026.xlsx",
    kind: "spreadsheet",
    size: "2.2 MB",
    modifiedAt: "Aug 05, 2026",
  },
  {
    id: "company-insurance-2026",
    folderId: "regulatory",
    name: "Company insurance certificate 2026.pdf",
    kind: "pdf",
    size: "3.8 MB",
    modifiedAt: "Aug 10, 2026",
  },
  {
    id: "external-audit-report-2025",
    folderId: "regulatory",
    name: "External audit report 2025.pdf",
    kind: "pdf",
    size: "8.7 MB",
    modifiedAt: "Aug 04, 2026",
  },
  {
    id: "fleet-risk-assessment",
    folderId: "regulatory",
    name: "Fleet risk assessment.docx",
    kind: "document",
    size: "1.6 MB",
    modifiedAt: "Jul 29, 2026",
  },
  {
    id: "operator-compliance-certificate",
    folderId: "regulatory",
    name: "Operator compliance certificate.pdf",
    kind: "pdf",
    size: "2.1 MB",
    modifiedAt: "Jul 25, 2026",
  },
  {
    id: "incident-report-2026-014",
    folderId: "regulatory",
    name: "Incident report - INC-2026-014.pdf",
    kind: "pdf",
    size: "5.4 MB",
    modifiedAt: "Jul 21, 2026",
  },
  {
    id: "certificate-of-incorporation",
    folderId: "internal",
    name: "Certificate of incorporation.pdf",
    kind: "pdf",
    size: "1.2 MB",
    modifiedAt: "Aug 08, 2026",
  },
  {
    id: "operator-licence",
    folderId: "internal",
    name: "Goods vehicle operator licence.pdf",
    kind: "pdf",
    size: "2.3 MB",
    modifiedAt: "Aug 02, 2026",
  },
  {
    id: "organisation-policies",
    folderId: "internal",
    name: "Organisation policies 2026.docx",
    kind: "document",
    size: "3.1 MB",
    modifiedAt: "Jul 30, 2026",
  },
  {
    id: "employee-handbook",
    folderId: "internal",
    name: "Employee handbook 2026.pdf",
    kind: "pdf",
    size: "6.8 MB",
    modifiedAt: "Jul 26, 2026",
  },
  {
    id: "internal-operating-processes",
    folderId: "internal",
    name: "Internal operating processes.docx",
    kind: "document",
    size: "4.2 MB",
    modifiedAt: "Jul 19, 2026",
  },
  {
    id: "management-meeting-minutes",
    folderId: "internal",
    name: "Management meeting minutes - July 2026.docx",
    kind: "document",
    size: "640 KB",
    modifiedAt: "Jul 15, 2026",
  },
] as const satisfies readonly Pick<
  FileManagerFile,
  "id" | "folderId" | "name" | "kind" | "size" | "modifiedAt"
>[];

const fileOwners = [
  { name: "Joe", initials: "JO" },
  { name: "Mehmet", initials: "ME" },
  { name: "Olivia Rhye", initials: "OR" },
] as const;

const generalFiles: FileManagerFile[] = fileSeeds.map((file, index) => {
  const owner = fileOwners[index % fileOwners.length];

  return {
    ...file,
    owner: owner.name,
    ownerInitials: owner.initials,
    shared: index % 3 !== 0,
    starred: index % 5 === 0,
  };
});

const contractDateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  timeZone: "UTC",
  year: "numeric",
});

export const contractFiles: FileManagerFile[] = contractTestData.map((contract) => ({
  id: `document-${contract.id.toLowerCase()}`,
  folderId: "clients",
  name: contract.fileName,
  kind: "pdf",
  size: contract.fileSize,
  owner: contract.uploadedBy,
  ownerInitials: getInitials(contract.uploadedBy),
  modifiedAt: contractDateFormatter.format(new Date(contract.uploadedAt)),
  shared: true,
  starred: false,
  contractId: contract.id,
}));

export const files: FileManagerFile[] = [...contractFiles, ...generalFiles];

export const folders: FileManagerFolder[] = folderDefinitions.map((folder) => ({
  ...folder,
  fileCount: files.filter((file) => file.folderId === folder.id).length,
}));

export function getFileManagerFolder(value: string | string[] | undefined) {
  const folderId = typeof value === "string" ? value : undefined;

  return folders.find((folder) => folder.id === folderId);
}
