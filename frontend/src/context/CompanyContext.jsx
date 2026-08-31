import { createContext, useContext, useState } from 'react'

const CompanyContext = createContext(null)

export function CompanyProvider({ children }) {
  const [companyId, setCompanyId] = useState(null)
  const [companyName, setCompanyName] = useState('')

  const selectCompany = (id, name) => {
    setCompanyId(id)
    setCompanyName(name)
  }

  return (
    <CompanyContext.Provider value={{ companyId, companyName, selectCompany }}>
      {children}
    </CompanyContext.Provider>
  )
}

export function useCompany() {
  const ctx = useContext(CompanyContext)
  if (!ctx) throw new Error('useCompany must be used within CompanyProvider')
  return ctx
}
