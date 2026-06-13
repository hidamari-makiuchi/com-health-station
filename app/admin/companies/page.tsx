import { listCompanies } from '@/lib/actions/companies'
import CompanyManager from '@/components/admin/CompanyManager'

export const revalidate = 0

export default async function AdminCompaniesPage() {
  const companies = await listCompanies()

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold">会社管理</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          契約会社の予約URLを管理します
        </p>
      </div>
      <CompanyManager initialCompanies={companies} />
    </div>
  )
}
