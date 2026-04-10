import { formatDistanceToNow, parseISO } from 'date-fns'

const etb = new Intl.NumberFormat('am-ET', {
  style: 'currency',
  currency: 'ETB',
})

export function formatCurrency(amount: string | number): string {
  const n = typeof amount === 'string' ? Number(amount) : amount
  if (Number.isNaN(n)) return etb.format(0)
  return etb.format(n)
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  const d = parseISO(iso)
  const day = d.getDate().toString().padStart(2, '0')
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ]
  const mon = months[d.getMonth()]
  const year = d.getFullYear()
  const hh = d.getHours().toString().padStart(2, '0')
  const mm = d.getMinutes().toString().padStart(2, '0')
  return `${day} ${mon} ${year}, ${hh}:${mm}`
}

export function formatRelative(iso: string | null | undefined): string {
  if (!iso) return '—'
  return formatDistanceToNow(parseISO(iso), { addSuffix: true })
}
