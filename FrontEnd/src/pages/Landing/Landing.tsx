import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { pickCardColor } from '@/utils/colorPalette'
import styles from './Landing.module.css'

const sampleUpdates = [
  { title: 'Summer Vacation Planning', message: "Let's start thinking about our annual summer trip! Drop ideas in the family chat.", meta: 'Dad • 2 hours ago', pinned: true },
  { title: 'New Family Photos', message: 'Mom uploaded photos from last weekend.', meta: 'Mom • 1 day ago' },
]

const birthdays = [
  { name: 'Sarah', date: 'May 15' },
  { name: 'Lucas', date: 'May 22' },
  { name: 'Grandma Rose', date: 'Jun 3' },
]

export function Landing() {
  const navigate = useNavigate()

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div>
            <h1>Welcome to KinEvents</h1>
            <p className={styles.lead}>Family moments together — plan, RSVP, and celebrate with the people you love.</p>
            <div className={styles.ctas}>
              <Button type="button" onClick={() => navigate('/login')}>Sign in</Button>
              <Button type="button" variant="secondary" onClick={() => navigate('/request-access')}>Request access</Button>
            </div>
          </div>
          <div className={styles.headerVisual}>
            <Card className={styles.stats}>
              <div className={styles.statItem}>
                <strong>3</strong>
                <span>Upcoming events</span>
              </div>
              <div className={styles.statItem}>
                <strong>18</strong>
                <span>RSVPs</span>
              </div>
              <div className={styles.statItem}>
                <strong>1</strong>
                <span>New request</span>
              </div>
            </Card>
          </div>
        </div>
      </header>

      <main className={styles.main}>
        <section className={styles.actionsRow}>
          <Card className={`${styles.actionCard} ${styles.actionPrimary}`} onClick={() => navigate('/events/create')}>
            <div className={styles.actionIcon}>📅</div>
            <div>New Event</div>
          </Card>
          <Card className={`${styles.actionCard} ${styles.actionAccent}`} onClick={() => navigate('/birthdays')}>
            <div className={styles.actionIcon}>🎂</div>
            <div>Add Birthday</div>
          </Card>
          <Card className={`${styles.actionCard} ${styles.actionGold}`} onClick={() => navigate('/notifications')}>
            <div className={styles.actionIcon}>💬</div>
            <div>Updates</div>
          </Card>
          <Card className={`${styles.actionCard} ${styles.actionSuccess}`} onClick={() => navigate('/users')}>
            <div className={styles.actionIcon}>👥</div>
            <div>Family</div>
          </Card>
        </section>

        <section className={styles.updatesArea}>
          <div className={styles.updatesCol}>
            <h2>Family Updates</h2>
            {sampleUpdates.map((u, idx) => (
              <article key={idx} className={`${styles.updateCard} ${u.pinned ? styles.pinned : ''}`}>
                <div>
                  <h3>{u.title}</h3>
                  <p>{u.message}</p>
                </div>
                <div className={styles.updateMeta}>{u.meta}</div>
              </article>
            ))}
          </div>

          <aside className={styles.birthdaysCol}>
            <h2>Upcoming Birthdays</h2>
            <div className={styles.birthdayGrid}>
              {birthdays.map((b, i) => (
                <Card key={i} className={styles.birthdayCard} style={{ ['--card-color' as any]: pickCardColor(b.name, true) }}>
                  <div className={styles.bdayContent}>
                    <div>
                      <strong>{b.name}</strong>
                      <div className={styles.bdayDate}>{b.date}</div>
                    </div>
                    <div className={styles.bdayDays}>6 days</div>
                  </div>
                </Card>
              ))}
            </div>
          </aside>
        </section>
      </main>
    </div>
  )
}

export default Landing