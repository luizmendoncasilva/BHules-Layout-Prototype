import { useState } from 'react'
import { ThumbsUp, ThumbsDown, Send } from 'lucide-react'
import { IconButton, Tooltip, TooltipTrigger, TooltipContent, Button, Textarea } from '@bhubai/bhub-design-system'
import { usePostFeedback } from '../../hooks/useFeedback'
import { useToast } from '../shared/Toast'

export default function FeedbackButtons({ validationResultId }) {
  const [vote, setVote] = useState(null) // 'up' | 'down' | null
  const [comment, setComment] = useState('')
  const [showComment, setShowComment] = useState(false)
  const feedbackMutation = usePostFeedback()
  const toast = useToast()

  const handleVote = (v) => {
    setVote(v)
    if (v === 'down') {
      setShowComment(true)
    } else {
      // Thumbs up: submit immediately
      feedbackMutation.mutate(
        { validation_result_id: validationResultId, vote: 'up', comment: '' },
        { onSuccess: () => toast.success('Feedback enviado') }
      )
    }
  }

  const handleSubmitComment = () => {
    feedbackMutation.mutate(
      { validation_result_id: validationResultId, vote: 'down', comment },
      { onSuccess: () => { toast.success('Feedback enviado'); setShowComment(false) } }
    )
  }

  return (
    <div>
      <div className="flex justify-end gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <IconButton
              aria-label="Feedback positivo"
              variant="ghost"
              size="sm"
              onClick={() => handleVote('up')}
              className={vote === 'up' ? 'text-success bg-success-subtle' : 'text-muted-foreground'}
            >
              <ThumbsUp className="w-4 h-4" />
            </IconButton>
          </TooltipTrigger>
          <TooltipContent>Feedback positivo</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <IconButton
              aria-label="Feedback negativo"
              variant="ghost"
              size="sm"
              onClick={() => handleVote('down')}
              className={vote === 'down' ? 'text-destructive bg-destructive-subtle' : 'text-muted-foreground'}
            >
              <ThumbsDown className="w-4 h-4" />
            </IconButton>
          </TooltipTrigger>
          <TooltipContent>Feedback negativo</TooltipContent>
        </Tooltip>
      </div>

      {showComment && (
        <div className="mt-3 space-y-2">
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="O que está errado nesta validação?"
            className="resize-none"
            rows={3}
          />
          <Button
            onClick={handleSubmitComment}
            disabled={feedbackMutation.isPending}
            size="sm"
          >
            <Send className="w-3.5 h-3.5" />
            Enviar
          </Button>
        </div>
      )}
    </div>
  )
}
