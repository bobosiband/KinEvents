import { useEffect, useState, type FormEvent } from 'react'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { useAuth } from '@/hooks/useAuth'
import { useTheme } from '@/hooks/useTheme'
import { useSaveSiteContent, useSiteContent } from '@/admin/hooks/useAdmin'
import styles from './SiteSettings.module.css'

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
    <form className={styles.page} onSubmit={submit}>
      <h1>Site Settings</h1>
      <Card className={styles.card}>
        <Input label="Homepage Title" value={homepageTitle} onChange={event => setHomepageTitle(event.target.value)} fullWidth />
        <Input label="Homepage Subtitle" value={homepageSubtitle} onChange={event => setHomepageSubtitle(event.target.value)} fullWidth />
        <label className={styles.label}>
          <span>Announcement</span>
          <textarea value={announcement} onChange={event => setAnnouncement(event.target.value)} />
        </label>
        <Button type="submit" loading={save.isPending}>Save</Button>
      </Card>
      <Card className={styles.card}>
        <h2>Theme</h2>
        <Button type="button" variant="secondary" onClick={toggleTheme}>{theme === 'dark' ? 'Light' : 'Dark'} mode</Button>
      </Card>
    </form>
  )
}
