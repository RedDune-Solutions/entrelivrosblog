import { MessageCircle } from 'lucide-react'

interface BookCommentCountProps {
  count: number
}

// Display puro — a contagem vem do servidor (getCommentCounts) numa só query,
// em vez de 1 fetch por linha.
export default function BookCommentCount({ count }: BookCommentCountProps) {
  return (
    <div className="flex items-center gap-1.5">
      <MessageCircle className={`h-3.5 w-3.5 ${count > 0 ? 'text-primary' : 'text-muted-foreground'}`} />
      <span className={`text-sm ${count > 0 ? 'font-medium text-primary' : 'text-muted-foreground'}`}>
        {count}
      </span>
    </div>
  )
}
