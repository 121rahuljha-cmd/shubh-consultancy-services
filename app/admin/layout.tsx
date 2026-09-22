import { LogoutButton } from '@/components/admin/logout-button'

export default function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <><LogoutButton />{children}</>
}
