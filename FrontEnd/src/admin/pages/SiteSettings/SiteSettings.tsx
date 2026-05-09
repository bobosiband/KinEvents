import { useEffect, useState, type FormEvent } from 'react'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { useAuth } from '@/hooks/useAuth'
import { useTheme } from '@/hooks/useTheme'
import { useSaveSiteContent, useSiteContent } from '@/admin/hooks/useAdmin'

export function SiteSettings() {
  const { theme, toggleTheme } = useTheme()
  const { user } = useAuth()
  const content = useSiteContent()
  const save = useSaveSiteContent()
  const [homepageTitle, setHomepageTitle] = useState('')
  const [homepageSubtitle, setHomepageSubtitle] = useState('')
  const [announcement, setAnnouncement] = useState('')

  useEffect(() => {
    if (!content.data) return
    setHomepageTitle(content.data.find(block => block.key === 'homepage_title')?.value || '')
    setHomepageSubtitle(content.data.find(block => block.key === 'homepage_subtitle')?.value || '')
    setAnnouncement(content.data.find(block => block.key === 'announcement')?.value || '')
  }, [content.data])

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (!user) return

    const blocks = [
      { key: 'homepage_title' as const, value: homepageTitle, updatedBy: user.id },
      { key: 'homepage_subtitle' as const, value: homepageSubtitle, updatedBy: user.id },
      { key: 'announcement' as const, value: announcement, updatedBy: user.id },
    ]

    Promise.all(blocks.map(block => save.mutateAsync(block)))
      .then(() => toast.success('Settings saved'))
      .catch(error => toast.error(error instanceof Error ? error.message : 'Unable to save settings'))
  }

  return (
    <form className="space-y-4" onSubmit={submit}>
      <h1 className="text-2xl font-bold">Site Settings</h1>
      <Card className="space-y-4">
        <Input label="Homepage Title" value={homepageTitle} onChange={event => setHomepageTitle(event.target.value)} fullWidth />
        <Input label="Homepage Subtitle" value={homepageSubtitle} onChange={event => setHomepageSubtitle(event.target.value)} fullWidth />
        <label className="block space-y-2">
          <span>Announcement</span>
          <textarea value={announcement} onChange={event => setAnnouncement(event.target.value)} className="w-full min-h-[120px] rounded-xl bg-muted p-3 focus:outline-none focus:ring-2 focus:ring-primary" />
        </label>
        <Button type="submit" loading={save.isPending}>Save</Button>
      </Card>
      <Card className="space-y-4">
        <h2 className="text-lg font-semibold">Theme</h2>
        <Button type="button" variant="secondary" onClick={toggleTheme}>{theme === 'dark' ? 'Light' : 'Dark'} mode</Button>
      </Card>
    </form>
  )
}
