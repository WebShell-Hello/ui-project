import { ContractVault } from "./_components/contract-vault";

interface ContractsPageProps {
  searchParams: Promise<{ contractId?: string | string[] }>;
}

export default async function ContractsPage({ searchParams }: ContractsPageProps) {
  const { contractId } = await searchParams;

  return <ContractVault initialContractId={typeof contractId === "string" ? contractId : undefined} />;
}
