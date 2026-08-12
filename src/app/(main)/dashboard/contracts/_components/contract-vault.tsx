"use client";

import * as React from "react";

import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CornerDownRight,
  Download,
  Ellipsis,
  FileText,
  Search,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import {
  type ContractClient,
  type ContractRecord,
  type ContractStatus,
  contractClients,
  contractTestData,
  getContractStatus,
} from "./contract-data";
import { ContractDetailsDialog } from "./contract-details-dialog";
import { EmployeeContractsTable } from "./employee-contracts-table";

const contractViews = ["client", "contract"] as const;
const contractCategories = ["client", "employee"] as const;

type ContractView = (typeof contractViews)[number];
type ContractCategory = (typeof contractCategories)[number];

const statusClasses: Record<ContractStatus, string> = {
  active:
    "border-emerald-200 bg-emerald-50 text-emerald-700 " +
    "dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300",
  upcoming:
    "border-blue-200 bg-blue-50 text-blue-700 " +
    "dark:border-blue-800 dark:bg-blue-950/50 dark:text-blue-300",
  expired:
    "border-slate-200 bg-slate-50 text-slate-700 " +
    "dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300",
};

function isContractView(value: string): value is ContractView {
  return contractViews.includes(value as ContractView);
}

function isContractCategory(value: string): value is ContractCategory {
  return contractCategories.includes(value as ContractCategory);
}

function formatStatus(status: ContractStatus) {
  return `${status.charAt(0).toUpperCase()}${status.slice(1)}`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00Z`));
}

function matchesContractSearch(
  contract: ContractRecord,
  client: ContractClient | undefined,
  normalizedQuery: string,
) {
  return [contract.name, contract.id, contract.service, client?.name]
    .filter(Boolean)
    .some((value) => value?.toLowerCase().includes(normalizedQuery));
}

interface ContractRowProps {
  contract: ContractRecord;
  client: ContractClient | undefined;
  showClient: boolean;
  nested?: boolean;
  onView: (contract: ContractRecord) => void;
  onDownload: (contract: ContractRecord) => void;
}

function ContractRow({
  contract,
  client,
  showClient,
  nested = false,
  onView,
  onDownload,
}: ContractRowProps) {
  const status = getContractStatus(contract);

  return (
    <TableRow className={nested ? "bg-muted/20" : undefined}>
      <TableCell>
        <div className={nested ? "flex min-w-0 items-center gap-3 pl-8" : "flex min-w-0 items-center gap-3"}>
          {nested ? (
            <CornerDownRight className="size-4 shrink-0 text-muted-foreground" />
          ) : (
            <div
              className={
                "flex size-9 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600 " +
                "dark:bg-red-950/50 dark:text-red-300"
              }
            >
              <FileText className="size-4" />
            </div>
          )}
          <div className="min-w-0">
            <Button
              type="button"
              variant="link"
              size="sm"
              className="h-auto max-w-64 justify-start px-0"
              onClick={() => onView(contract)}
            >
              <span className="truncate">{contract.name}</span>
            </Button>
            <p className="text-muted-foreground text-xs">{contract.id}</p>
          </div>
        </div>
      </TableCell>
      {showClient && <TableCell>{client?.name}</TableCell>}
      <TableCell>{contract.service}</TableCell>
      <TableCell className="text-muted-foreground">
        {formatDate(contract.startDate)} – {formatDate(contract.endDate)}
      </TableCell>
      <TableCell className="font-medium tabular-nums">
        £{contract.rate.toFixed(2)} {contract.rateUnit}
      </TableCell>
      <TableCell>
        <Badge variant="outline" className={statusClasses[status]}>
          {formatStatus(status)}
        </Badge>
      </TableCell>
      <TableCell className="text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={`Actions for ${contract.name}`}
            >
              <Ellipsis />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => onView(contract)}>
              <FileText />
              View details
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onDownload(contract)}>
              <Download />
              Download contract
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}

interface ContractVaultProps {
  initialContractId?: string;
}

export function ContractVault({ initialContractId }: ContractVaultProps) {
  const [contractCategory, setContractCategory] = React.useState<ContractCategory>("client");
  const [view, setView] = React.useState<ContractView>("client");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [expandedClientIds, setExpandedClientIds] = React.useState<Set<string>>(() => new Set());
  const [selectedContract, setSelectedContract] = React.useState<ContractRecord | null>(
    () => contractTestData.find((contract) => contract.id === initialContractId) ?? null,
  );
  const [pageSize, setPageSize] = React.useState(10);
  const [pageIndex, setPageIndex] = React.useState(0);

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const visibleContracts = contractTestData.filter((contract) => {
    const client = contractClients.find((item) => item.id === contract.clientId);

    return matchesContractSearch(contract, client, normalizedQuery);
  });
  const visibleClients = contractClients.filter((client) => {
    const clientContracts = contractTestData.filter((contract) => contract.clientId === client.id);
    const clientMatches = client.name.toLowerCase().includes(normalizedQuery);

    return (
      clientMatches ||
      clientContracts.some((contract) => matchesContractSearch(contract, client, normalizedQuery))
    );
  });
  const totalVisibleItems = view === "client" ? visibleClients.length : visibleContracts.length;
  const pageCount = Math.max(1, Math.ceil(totalVisibleItems / pageSize));
  const currentPageIndex = Math.min(pageIndex, pageCount - 1);
  const pageStart = currentPageIndex * pageSize;
  const paginatedClients = visibleClients.slice(pageStart, pageStart + pageSize);
  const paginatedContracts = visibleContracts.slice(pageStart, pageStart + pageSize);
  const visibleItemCount = view === "client" ? paginatedClients.length : paginatedContracts.length;

  const selectedContractClient =
    contractClients.find((client) => client.id === selectedContract?.clientId) ?? null;
  const selectedContractStatus = selectedContract ? getContractStatus(selectedContract) : null;

  function toggleClient(clientId: string) {
    setExpandedClientIds((currentIds) => {
      const nextIds = new Set(currentIds);

      if (nextIds.has(clientId)) {
        nextIds.delete(clientId);
      } else {
        nextIds.add(clientId);
      }

      return nextIds;
    });
  }

  function previewDownload(contract: ContractRecord) {
    toast.info(`Download for ${contract.fileName} will be connected when the API is available.`);
  }

  function updatePageSize(value: string) {
    const nextPageSize = Number(value);

    if (Number.isInteger(nextPageSize) && nextPageSize >= 1 && nextPageSize <= 100) {
      setPageSize(nextPageSize);
      setPageIndex(0);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl leading-none tracking-tight">Contract Vault</h1>
          <p className="text-muted-foreground text-sm">
            {contractCategory === "client"
              ? "Manage client contracts and the rates used to generate invoices."
              : "Manage employee agreements, terms, and employment records."}
          </p>
        </div>
        <Select
          value={contractCategory}
          onValueChange={(value) => {
            if (isContractCategory(value)) {
              setContractCategory(value);
              setSelectedContract(null);
            }
          }}
        >
          <SelectTrigger className="w-full sm:w-48" aria-label="Contract category">
            <SelectValue />
          </SelectTrigger>
          <SelectContent align="end">
            <SelectGroup>
              <SelectItem value="client">Client contracts</SelectItem>
              <SelectItem value="employee">Employee contracts</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      <section
        className="flex flex-col gap-3"
        aria-labelledby="contracts-heading"
        hidden={contractCategory !== "client"}
      >
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <Tabs
            value={view}
            onValueChange={(value) => {
              if (isContractView(value)) {
                setView(value);
                setPageIndex(0);
              }
            }}
          >
            <TabsList>
              <TabsTrigger value="client" className="px-4">
                Client
              </TabsTrigger>
              <TabsTrigger value="contract" className="px-4">
                Contract
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <InputGroup className="md:max-w-sm">
            <InputGroupInput
              value={searchQuery}
              placeholder={view === "client" ? "Search clients..." : "Search contracts..."}
              aria-label={view === "client" ? "Search clients" : "Search contracts"}
              onChange={(event) => {
                setSearchQuery(event.target.value);
                setPageIndex(0);
              }}
            />
            <InputGroupAddon>
              <Search />
            </InputGroupAddon>
          </InputGroup>
        </div>

        <Card>
          <CardContent className="flex flex-col gap-4 px-0">
            <Table>
              {view === "client" ? (
                <>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Client / Contract</TableHead>
                      <TableHead>Service</TableHead>
                      <TableHead>Term</TableHead>
                      <TableHead>Rate</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedClients.length > 0 ? (
                      paginatedClients.map((client) => {
                        const allClientContracts = contractTestData.filter(
                          (contract) => contract.clientId === client.id,
                        );
                        const clientNameMatches = client.name.toLowerCase().includes(normalizedQuery);
                        const clientContracts = clientNameMatches
                          ? allClientContracts
                          : allClientContracts.filter((contract) =>
                              matchesContractSearch(contract, client, normalizedQuery),
                            );
                        const activeContracts = allClientContracts.filter(
                          (contract) => getContractStatus(contract) === "active",
                        ).length;
                        const isExpanded =
                          expandedClientIds.has(client.id) ||
                          (normalizedQuery.length > 0 && clientContracts.length > 0);

                        return (
                          <React.Fragment key={client.id}>
                            <TableRow className="bg-muted/30 hover:bg-muted/50">
                              <TableCell>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  className="h-auto justify-start px-2 py-1.5"
                                  aria-expanded={isExpanded}
                                  onClick={() => toggleClient(client.id)}
                                >
                                  {isExpanded ? <ChevronDown /> : <ChevronRight />}
                                  <span className="font-semibold">{client.name}</span>
                                  <span className="text-muted-foreground text-xs">
                                    {allClientContracts.length} contracts
                                  </span>
                                </Button>
                              </TableCell>
                              <TableCell colSpan={3} className="text-muted-foreground">
                                {allClientContracts.length} contracts on file
                              </TableCell>
                              <TableCell>
                                <Badge variant="secondary">{activeContracts} active</Badge>
                              </TableCell>
                              <TableCell />
                            </TableRow>

                            {isExpanded &&
                              clientContracts.map((contract) => (
                                <ContractRow
                                  key={contract.id}
                                  contract={contract}
                                  client={client}
                                  showClient={false}
                                  nested
                                  onView={setSelectedContract}
                                  onDownload={previewDownload}
                                />
                              ))}
                          </React.Fragment>
                        );
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="h-28 text-center text-muted-foreground">
                          No clients found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </>
              ) : (
                <>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Contract</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Service</TableHead>
                      <TableHead>Term</TableHead>
                      <TableHead>Rate</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedContracts.length > 0 ? (
                      paginatedContracts.map((contract) => (
                        <ContractRow
                          key={contract.id}
                          contract={contract}
                          client={contractClients.find((client) => client.id === contract.clientId)}
                          showClient
                          onView={setSelectedContract}
                          onDownload={previewDownload}
                        />
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="h-28 text-center text-muted-foreground">
                          No contracts found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </>
              )}
            </Table>

            <div className="flex flex-col gap-3 px-4 pb-1 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-muted-foreground text-sm">
                Viewing {visibleItemCount} out of {totalVisibleItems}{" "}
                {view === "client" ? "clients" : "contracts"}
              </p>

              <div className="flex flex-wrap items-center gap-2">
                <label className="text-muted-foreground text-sm" htmlFor="contracts-page-size">
                  Rows per page
                </label>

                <Input
                  id="contracts-page-size"
                  className="h-8 w-16 text-center"
                  type="number"
                  min="1"
                  max="100"
                  value={pageSize}
                  onChange={(event) => updatePageSize(event.target.value)}
                />

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={currentPageIndex === 0}
                  onClick={() => setPageIndex((currentIndex) => currentIndex - 1)}
                >
                  <ChevronLeft />
                  Previous
                </Button>

                <span className="flex size-8 items-center justify-center rounded-md bg-muted text-sm">
                  {currentPageIndex + 1}
                </span>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={currentPageIndex >= pageCount - 1}
                  onClick={() => setPageIndex((currentIndex) => currentIndex + 1)}
                >
                  Next
                  <ChevronRight />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {contractCategory === "employee" && <EmployeeContractsTable />}

      {contractCategory === "client" && (
        <ContractDetailsDialog
          contract={selectedContract}
          client={selectedContractClient}
          status={selectedContractStatus}
          open={selectedContract !== null}
          onOpenChange={(open) => {
            if (!open) {
              setSelectedContract(null);
            }
          }}
          onDownload={() => {
            if (selectedContract) {
              previewDownload(selectedContract);
            }
          }}
        />
      )}
    </div>
  );
}
