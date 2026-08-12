"use client";

import * as React from "react";

import {
  ChevronLeft,
  ChevronRight,
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
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

import {
  type EmployeeContractRecord,
  type EmployeeContractStatus,
  employeeContractTestData,
  getEmployeeContractStatus,
} from "./employee-contract-data";

const statusVariants: Record<EmployeeContractStatus, "default" | "secondary" | "destructive"> = {
  active: "default",
  upcoming: "secondary",
  expired: "destructive",
};

function formatLabel(value: string) {
  return value
    .split("_")
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00Z`));
}

function matchesSearch(contract: EmployeeContractRecord, normalizedQuery: string) {
  return [
    contract.id,
    contract.employeeId,
    contract.employeeName,
    contract.jobTitle,
    contract.contractType,
  ].some((value) => value.toLowerCase().includes(normalizedQuery));
}

export function EmployeeContractsTable() {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [pageSize, setPageSize] = React.useState(10);
  const [pageIndex, setPageIndex] = React.useState(0);

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const visibleContracts = employeeContractTestData.filter((contract) =>
    matchesSearch(contract, normalizedQuery),
  );
  const pageCount = Math.max(1, Math.ceil(visibleContracts.length / pageSize));
  const currentPageIndex = Math.min(pageIndex, pageCount - 1);
  const pageStart = currentPageIndex * pageSize;
  const paginatedContracts = visibleContracts.slice(pageStart, pageStart + pageSize);

  function updatePageSize(value: string) {
    const nextPageSize = Number(value);

    if (Number.isInteger(nextPageSize) && nextPageSize >= 1 && nextPageSize <= 100) {
      setPageSize(nextPageSize);
      setPageIndex(0);
    }
  }

  function previewDownload(contract: EmployeeContractRecord) {
    toast.info(`Download for ${contract.fileName} will be connected when the API is available.`);
  }

  return (
    <section className="flex flex-col gap-3" aria-labelledby="employee-contracts-heading">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 id="employee-contracts-heading" className="font-semibold text-sm">
            Employee contracts
          </h2>
          <p className="text-muted-foreground text-xs">
            Employment agreements held for current employees.
          </p>
        </div>

        <InputGroup className="md:max-w-sm">
          <InputGroupInput
            value={searchQuery}
            placeholder="Search employee contracts..."
            aria-label="Search employee contracts"
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
            <TableHeader>
              <TableRow>
                <TableHead>Employee / Contract</TableHead>
                <TableHead>Job title</TableHead>
                <TableHead>Contract type</TableHead>
                <TableHead>Term</TableHead>
                <TableHead>Annual salary</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedContracts.length > 0 ? (
                paginatedContracts.map((contract) => {
                  const status = getEmployeeContractStatus(contract);

                  return (
                    <TableRow key={contract.id}>
                      <TableCell>
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                            <FileText className="size-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-medium">{contract.employeeName}</p>
                            <p className="text-muted-foreground text-xs">
                              {contract.employeeId} · {contract.id}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{contract.jobTitle}</TableCell>
                      <TableCell>{formatLabel(contract.contractType)}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(contract.startDate)}
                        {" – "}
                        {contract.endDate ? formatDate(contract.endDate) : "Ongoing"}
                      </TableCell>
                      <TableCell className="font-medium tabular-nums">
                        £{contract.annualSalary.toLocaleString("en-GB")}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusVariants[status]}>{formatLabel(status)}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-sm"
                              aria-label={`Actions for ${contract.employeeName}`}
                            >
                              <Ellipsis />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuGroup>
                              <DropdownMenuItem onSelect={() => previewDownload(contract)}>
                                <Download />
                                Download contract
                              </DropdownMenuItem>
                            </DropdownMenuGroup>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="h-28 text-center text-muted-foreground">
                    No employee contracts found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          <div className="flex flex-col gap-3 px-4 pb-1 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-muted-foreground text-sm">
              Viewing {paginatedContracts.length} out of {visibleContracts.length} contracts
            </p>

            <div className="flex flex-wrap items-center gap-2">
              <label className="text-muted-foreground text-sm" htmlFor="employee-contracts-page-size">
                Rows per page
              </label>

              <Input
                id="employee-contracts-page-size"
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
  );
}
