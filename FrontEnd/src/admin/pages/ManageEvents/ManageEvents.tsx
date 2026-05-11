import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { DataTable, type Column } from '@/admin/components/DataTable/DataTable'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { EventForm } from '@/features/events/components/EventForm/EventForm'
import { useDeleteEvent, useUpdateEvent } from '@/features/events/hooks/useCreateEvent'
import { useEvents } from '@/features/events/hooks/useEvents'
import { useGenerateBirthdays } from '@/features/birthdays/hooks/useBirthdays'
import type { Event, EventPayload } from '@/features/events/types/event.types'

type ValidationErrorLike = {
  response?: {
    data?: {
      details?: {
        fieldErrors?: Record<string, string[]>
      }
    }
  }
  details?: {
    fieldErrors?: Record<string, string[]>
  }
}

const columns: Column<Event>[] = [
  { key: 'title', header: 'Name' },
  { key: 'type', header: 'Type' },
  { key: 'date', header: 'Date', render: row => new Date(row.date).toLocaleDateString() },
  { key: 'locked', header: 'Locked' },
  { key: 'rsvps', header: 'Attendees', render: row => String(Object.values(row.rsvps).filter(status => status === 'yes').length) },
]

export function ManageEvents() {
  const queryClient = useQueryClient()
  const events = useEvents()
  const remove = useDeleteEvent()
  const generate = useGenerateBirthdays()
  const [editing, setEditing] = useState<Event | undefined>()
  const update = useUpdateEvent(editing?.id || '')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]> | undefined>(undefined)

  const submit = (payload: EventPayload) => {
    setFieldErrors(undefined)
    update.mutate(payload, {
      onSuccess: () => {
        toast.success('Event saved')
        setEditing(undefined)
      },
      onError: err => {
        const validationError = err as ValidationErrorLike
        const serverFieldErrors = validationError.response?.data?.details?.fieldErrors || validationError.details?.fieldErrors
        if (serverFieldErrors) {
          setFieldErrors(serverFieldErrors)
          toast.error('Validation failed')
          return
        }
        toast.error(err instanceof Error ? err.message : 'Failed to save event')
      },
    })
  }

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-2xl font-bold">Manage Events</h1>
        <Button
          onClick={() =>
            generate.mutate(undefined, {
              onSuccess: () => toast.success('Birthday events generated'),
              onError: err => toast.error(err instanceof Error ? err.message : 'Failed to generate'),
            })
          }
        >
          Generate Birthdays
        </Button>
      </header>
      <DataTable
        columns={columns}
        data={events.data || []}
        loading={events.isLoading}
        emptyMessage="No events found."
        actions={[
          { label: 'Edit', onClick: setEditing },
          {
            label: 'Delete',
            tone: 'danger',
            onClick: event =>
              remove.mutate(event.id, {
                onSuccess: async (_data, deletedId) => {
                  queryClient.setQueryData<Event[]>(['events'], currentEvents =>
                    currentEvents?.filter(item => item.id !== deletedId) ?? []
                  )
                  await queryClient.invalidateQueries({ queryKey: ['events'] })
                  toast.success('Event deleted')
                },
                onError: err => toast.error(err instanceof Error ? err.message : 'Failed to delete'),
              }),
          },
        ]}
      />
      <Modal title="Edit Event" open={Boolean(editing)} onClose={() => setEditing(undefined)}>
        {editing ? <EventForm event={editing} loading={update.isPending} onSubmit={submit} fieldErrors={fieldErrors} /> : null}
      </Modal>
    </div>
  )
}
