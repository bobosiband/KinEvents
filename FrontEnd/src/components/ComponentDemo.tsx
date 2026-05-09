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
  Modal,
  ToastContainer,
  useToast,
} from './ui'

import styles from './ComponentDemo.module.css'

export const ComponentDemo: React.FC = () => {
  const toast = useToast()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
    country: 'us',
    message: '',
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.currentTarget
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.currentTarget as HTMLInputElement).checked : value,
    }))
  }

  const handleShowSuccess = () => {
    toast.success('Operation completed successfully!', 3000)
  }

  const handleShowError = () => {
    toast.error('An error occurred. Please try again.', 3000)
  }

  const handleShowInfo = () => {
    toast.info('Here is some useful information.', 3000)
  }

  const handleShowWarning = () => {
    toast.warning('Please be careful with this action.', 3000)
  }

  const handleShowWithAction = () => {
    toast.show('Undo action?', 'info', 5000, {
      label: 'Undo',
      onClick: () => toast.success('Action undone!'),
    })
  }

  const handleSubmit = () => {
    if (!formData.email || !formData.password) {
      toast.error('Please fill in all required fields')
      return
    }
    toast.success('Form submitted successfully!')
    setIsModalOpen(false)
  }

  const handleModalConfirm = () => {
    handleSubmit()
  }

  return (
    <>
      <div className={styles.container}>
        <h1>KinEvents Component Demo</h1>
        <p className={styles.subtitle}>Comprehensive component showcase with Toast & Modal</p>

        {/* Toast Demo Section */}
        <section className={styles.section}>
          <h2>Toast Notifications</h2>
          <Card padding="large">
            <div className={styles.buttonGrid}>
              <Button variant="primary" onClick={handleShowSuccess}>
                Show Success
              </Button>
              <Button variant="danger" onClick={handleShowError}>
                Show Error
              </Button>
              <Button variant="secondary" onClick={handleShowInfo}>
                Show Info
              </Button>
              <Button variant="secondary" onClick={handleShowWarning}>

                Show Warning
              </Button>
              <Button variant="primary" onClick={handleShowWithAction}>
                With Action
              </Button>
            </div>
          </Card>
        </section>

        {/* Modal Demo Section */}
        <section className={styles.section}>
          <h2>Modal Dialog</h2>
          <Card padding="large">
            <Button variant="primary" onClick={() => setIsModalOpen(true)}>
              Open Modal
            </Button>
          </Card>
        </section>

        {/* Status & Badges Demo */}
        <section className={styles.section}>
          <h2>Status Indicators & Badges</h2>
          <Card padding="large">
            <div className={styles.column}>
              <h3>User Avatars with Status</h3>
              <div className={styles.flex}>
                <Avatar name="Online User" size="md" status="online" />
                <Avatar name="Away User" size="md" status="away" />
                <Avatar name="Offline User" size="md" status="offline" />
              </div>
            </div>

            <div className={styles.column}>
              <h3>Role Badges</h3>
              <div className={styles.flex}>
                <Badge variant="primary">Admin</Badge>
                <Badge variant="secondary">Member</Badge>
                <Badge variant="success">Active</Badge>
                <Badge variant="danger">Pending</Badge>
              </div>
            </div>
          </Card>
        </section>

        {/* Form Demo */}
        <section className={styles.section}>
          <h2>Form Components</h2>
          <Card padding="large">
            <div className={styles.formContainer}>
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
                  ]}
                />
              </FormGroup>

              <Checkbox
                id="subscribe"
                label="Subscribe to updates"
              />
            </div>
          </Card>
        </section>
      </div>

      {/* Toast Container */}
      <ToastContainer toasts={toast.toasts} onDismiss={toast.dismiss} />

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Confirm Action"
        size="md"
        footer={
          <div className={styles.modalFooter}>
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleModalConfirm}>
              Confirm
            </Button>
          </div>
        }
      >
        <p>Are you sure you want to proceed with this action?</p>
        <p>This action cannot be undone.</p>
      </Modal>
    </>
  )
}

export default ComponentDemo
