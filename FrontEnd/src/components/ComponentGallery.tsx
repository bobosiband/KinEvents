import React, { useState } from 'react'
import {
  Button,
  Card,
  Input,
  Label,
  FormGroup,
  TextArea,
  Checkbox,
  Select,
  Avatar,
  Badge,

} from './ui'

import styles from './ComponentGallery.module.css'

export const ComponentGallery: React.FC = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
    country: 'us',
    message: '',
  })
  const [toastMessage, setToastMessage] = useState('')

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.currentTarget
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.currentTarget as HTMLInputElement).checked : value,
    }))
  }

  const avatarList = [
    { name: 'John Doe', src: undefined },
    { name: 'Jane Smith', src: undefined },
    { name: 'Mike Johnson', src: undefined },
    { name: 'Sarah Williams', src: undefined },
  ]

  return (
    <div className={styles.gallery}>
      <h1>KinEvents Component Gallery</h1>

      {/* Buttons Section */}
      <section className={styles.section}>
        <h2>Buttons</h2>
        <div className={styles.grid}>
          <div className={styles.column}>
            <h3>Primary Variant</h3>
            <Button variant="primary" size="small">Small</Button>
            <Button variant="primary" size="medium">Medium</Button>
            <Button variant="primary" size="large">Large</Button>
          </div>

          <div className={styles.column}>
            <h3>Secondary Variant</h3>
            <Button variant="secondary" size="small">Small</Button>
            <Button variant="secondary" size="medium">Medium</Button>
            <Button variant="secondary" size="large">Large</Button>
          </div>

          <div className={styles.column}>
            <h3>Ghost Variant</h3>
            <Button variant="ghost" size="small">Small</Button>
            <Button variant="ghost" size="medium">Medium</Button>
            <Button variant="ghost" size="large">Large</Button>
          </div>

          <div className={styles.column}>
            <h3>Danger Variant</h3>
            <Button variant="danger" size="small">Small</Button>
            <Button variant="danger" size="medium">Medium</Button>
            <Button variant="danger" size="large">Large</Button>
          </div>
        </div>

        <div className={styles.grid}>
          <div className={styles.column}>
            <h3>States</h3>
            <Button variant="primary" disabled>Disabled</Button>
            <Button variant="primary" isLoading>Loading</Button>
            <Button variant="primary" fullWidth>Full Width</Button>
          </div>
        </div>
      </section>

      {/* Cards Section */}
      <section className={styles.section}>
        <h2>Cards</h2>
        <div className={styles.grid}>
          <Card variant="elevated" padding="medium">
            <h3>Elevated Card</h3>
            <p>This card has elevation and shadow effects.</p>
          </Card>

          <Card variant="flat" padding="medium">
            <h3>Flat Card</h3>
            <p>This card has no shadow effects.</p>
          </Card>

          <Card variant="interactive" padding="medium">
            <h3>Interactive Card</h3>
            <p>This card responds to hover and click interactions.</p>
          </Card>
        </div>
      </section>

      {/* Form Section */}
      <section className={styles.section}>
        <h2>Forms</h2>
        <Card padding="large">
          <form className={styles.form}>
            <FormGroup label="Email" labelFor="email" required>
              <Input
                id="email"
                type="email"
                name="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleInputChange}
              />
            </FormGroup>

            <FormGroup label="Password" labelFor="password" required>
              <Input
                id="password"
                type="password"
                name="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleInputChange}
              />
            </FormGroup>

            <FormGroup label="Country" labelFor="country">
              <Select
                id="country"
                name="country"
                value={formData.country}
                onChange={handleInputChange}
                options={[
                  { value: 'us', label: 'United States' },
                  { value: 'uk', label: 'United Kingdom' },
                  { value: 'ca', label: 'Canada' },
                  { value: 'au', label: 'Australia' },
                ]}
              />
            </FormGroup>

            <FormGroup label="Message" labelFor="message">
              <TextArea
                id="message"
                name="message"
                placeholder="Enter your message"
                value={formData.message}
                onChange={handleInputChange}
              />
            </FormGroup>

            <Checkbox
              id="remember"
              name="rememberMe"
              label="Remember me"
              checked={formData.rememberMe}
              onChange={handleInputChange}
            />

            <div className={styles.buttonGroup}>
              <Button variant="primary" onClick={() => setToastMessage('Form submitted!')}>
                Submit
              </Button>
              <Button variant="ghost">Cancel</Button>
            </div>
          </form>
        </Card>
      </section>

      {/* Avatars Section */}
      <section className={styles.section}>
        <h2>Avatars</h2>
        <div className={styles.grid}>
          <div className={styles.column}>
            <h3>Sizes</h3>
            <div className={styles.flex}>
              <Avatar name="John Doe" size="sm" />
              <Avatar name="Jane Smith" size="md" />
              <Avatar name="Mike Johnson" size="lg" />
            </div>
          </div>

          <div className={styles.column}>
            <h3>Status Indicators</h3>
            <div className={styles.flex}>
              <Avatar name="Online User" size="md" status="online" />
              <Avatar name="Away User" size="md" status="away" />
              <Avatar name="Offline User" size="md" status="offline" />
            </div>
          </div>

          <div className={styles.column}>
            <h3>Avatar Group</h3>
            <p>Avatar group not available in current UI kit.</p>
          </div>

        </div>
      </section>

      {/* Badges Section */}
      <section className={styles.section}>
        <h2>Badges</h2>
        <div className={styles.grid}>
          <div className={styles.column}>
            <h3>Variants (Medium)</h3>
            <div className={styles.flex}>
              <Badge variant="primary">Primary</Badge>
              <Badge variant="secondary">Secondary</Badge>
              <Badge variant="success">Success</Badge>
              <Badge variant="danger">Danger</Badge>
              <Badge variant="warning">Warning</Badge>
            </div>
          </div>

          <div className={styles.column}>
            <h3>Sizes</h3>
            <div className={styles.flex}>
              <Badge variant="primary" size="sm">Small</Badge>
              <Badge variant="primary" size="md">Medium</Badge>
              <Badge variant="primary" size="lg">Large</Badge>
            </div>
          </div>

          <div className={styles.column}>
            <h3>Dismissible</h3>
            <div className={styles.flex}>
              <Badge variant="primary" dismissible onDismiss={() => console.log('Dismissed')}>
                Close me
              </Badge>
            </div>
          </div>
        </div>
      </section>

      {/* Toast Message */}
      {toastMessage && (
        <div className={styles.toast}>
          {toastMessage}
          <button onClick={() => setToastMessage('')}>×</button>
        </div>
      )}
    </div>
  )
}

export default ComponentGallery
