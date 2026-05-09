# KinEvents Component Quick Start Guide

## Installation & Setup

All components are in `/FrontEnd/src/components/ui/` and exported from a single index file:

```typescript
// ✅ DO THIS - Import from index
import { Button, Card, Input, Avatar, Badge, Modal, useToast } from '@/components/ui'

// ❌ DON'T DO THIS - Don't import directly
import Button from '@/components/ui/Button/Button'
```

## Essential Components

### 1. Button
```typescript
import { Button } from '@/components/ui'

export default function MyComponent() {
  return (
    <>
      <Button>Default (Primary)</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="danger">Danger</Button>
      
      <Button size="small">Small</Button>
      <Button size="medium">Medium</Button>
      <Button size="large">Large</Button>
      
      <Button isLoading>Loading...</Button>
      <Button disabled>Disabled</Button>
      <Button fullWidth>Full Width</Button>
      
      <Button icon="🔍" iconPosition="left">Search</Button>
    </>
  )
}
```

### 2. Card
```typescript
import { Card } from '@/components/ui'

export default function MyComponent() {
  return (
    <>
      <Card variant="elevated" padding="medium">
        <h3>Elevated Card</h3>
        <p>Content here</p>
      </Card>
      
      <Card variant="interactive" clickable href="/page">
        Clickable Card
      </Card>
    </>
  )
}
```

### 3. Form Input
```typescript
import { Input, FormGroup, Label } from '@/components/ui'
import { useState } from 'react'

export default function LoginForm() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')

  return (
    <FormGroup 
      label="Email Address" 
      labelFor="email"
      required
      error={error}
      hint="We'll never share your email"
    >
      <Input
        id="email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="name@example.com"
      />
    </FormGroup>
  )
}
```

### 4. Checkbox & Select
```typescript
import { Checkbox, Select, FormGroup } from '@/components/ui'

export default function FormExample() {
  return (
    <>
      <Checkbox id="terms" label="I agree to terms" />
      
      <FormGroup label="Country">
        <Select
          options={[
            { value: 'us', label: 'United States' },
            { value: 'uk', label: 'United Kingdom' },
            { value: 'ca', label: 'Canada' },
          ]}
        />
      </FormGroup>
    </>
  )
}
```

### 5. TextArea
```typescript
import { TextArea, FormGroup } from '@/components/ui'

export default function ContactForm() {
  return (
    <FormGroup label="Message" labelFor="message">
      <TextArea
        id="message"
        placeholder="Enter your message"
        rows={5}
      />
    </FormGroup>
  )
}
```

### 6. Avatar
```typescript
import { Avatar, AvatarGroup } from '@/components/ui'

export default function TeamMembers() {
  return (
    <>
      {/* Single Avatar */}
      <Avatar name="John Doe" size="md" status="online" />
      <Avatar src="/path/to/image.jpg" alt="User" size="lg" />
      
      {/* Avatar Group */}
      <AvatarGroup
        avatars={[
          { name: 'John Doe' },
          { name: 'Jane Smith' },
          { name: 'Mike Johnson' },
        ]}
        max={3}
        size="md"
      />
    </>
  )
}
```

### 7. Badge
```typescript
import { Badge } from '@/components/ui'

export default function StatusIndicators() {
  return (
    <>
      <Badge variant="primary">Primary</Badge>
      <Badge variant="success">Active</Badge>
      <Badge variant="danger" dismissible onDismiss={() => {}}>Removable</Badge>
    </>
  )
}
```

### 8. Toast Notifications
```typescript
import { useToast, ToastContainer } from '@/components/ui'

export default function MyPage() {
  const toast = useToast()

  const handleSave = async () => {
    try {
      // ... save logic
      toast.success('Saved successfully!')
    } catch (error) {
      toast.error('Failed to save')
    }
  }

  return (
    <>
      <button onClick={handleSave}>Save</button>
      
      {/* Show all toasts */}
      <ToastContainer toasts={toast.toasts} onDismiss={toast.dismiss} />
    </>
  )
}

// Usage patterns:
// toast.success(message, duration?)
// toast.error(message, duration?)
// toast.info(message, duration?)
// toast.warning(message, duration?)
// toast.show(message, type, duration, action?)
// toast.dismiss(id)
```

### 9. Modal
```typescript
import { Modal, Button } from '@/components/ui'
import { useState } from 'react'

export default function DeleteConfirm() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>Delete</Button>
      
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Confirm Delete"
        size="md"
        closeOnEscape
        closeOnBackdropClick
        footer={
          <div style={{ display: 'flex', gap: '12px' }}>
            <Button variant="ghost" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={() => {
              // Delete action
              setIsOpen(false)
            }}>
              Delete
            </Button>
          </div>
        }
      >
        <p>This action cannot be undone.</p>
      </Modal>
    </>
  )
}
```

## Common Patterns

### Form with Validation
```typescript
import { FormGroup, Input, Button, useToast, ToastContainer } from '@/components/ui'
import { useState } from 'react'

export default function SignupForm() {
  const toast = useToast()
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = () => {
    const newErrors: Record<string, string> = {}
    if (!formData.email) newErrors.email = 'Email is required'
    if (!formData.password) newErrors.password = 'Password is required'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    
    toast.success('Account created!')
  }

  return (
    <form onSubmit={handleSubmit}>
      <FormGroup label="Email" required error={errors.email}>
        <Input
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        />
      </FormGroup>
      
      <FormGroup label="Password" required error={errors.password}>
        <Input
          type="password"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
        />
      </FormGroup>
      
      <Button type="submit" fullWidth>Sign Up</Button>
      <ToastContainer toasts={toast.toasts} onDismiss={toast.dismiss} />
    </form>
  )
}
```

### Card Grid Layout
```typescript
import { Card } from '@/components/ui'

export default function Dashboard() {
  return (
    <div style={{ 
      display: 'grid', 
      gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
      gap: '24px'
    }}>
      <Card variant="elevated">
        <h3>Metric 1</h3>
        <p>Value: 42</p>
      </Card>
      
      <Card variant="elevated">
        <h3>Metric 2</h3>
        <p>Value: 100</p>
      </Card>
    </div>
  )
}
```

## Customization

### Custom Styling
```typescript
import { Button } from '@/components/ui'
import styles from './MyComponent.module.css'

export default function CustomButton() {
  // Add custom class alongside component styles
  return (
    <Button className={styles.customButton}>
      Styled Button
    </Button>
  )
}
```

In `MyComponent.module.css`:
```css
.customButton {
  /* Override or extend button styles */
  font-size: 18px;
  letter-spacing: 2px;
}
```

### Theme Switching
```typescript
// Light mode (default)
document.documentElement.removeAttribute('data-theme')

// Dark mode
document.documentElement.setAttribute('data-theme', 'dark')
```

## Accessibility Features

All components include:
- ✅ Semantic HTML
- ✅ ARIA labels and descriptions
- ✅ Keyboard navigation support
- ✅ Focus management
- ✅ Screen reader support

Example:
```typescript
<Input
  id="search"
  aria-label="Search events"
  aria-describedby="search-hint"
  placeholder="Search..."
/>
<span id="search-hint">Type to search by event name</span>
```

## Dark Mode Support

All components automatically support dark mode. Just switch the theme:

```typescript
export default function App() {
  const [isDark, setIsDark] = useState(false)

  const toggleDarkMode = () => {
    setIsDark(!isDark)
    if (!isDark) {
      document.documentElement.setAttribute('data-theme', 'dark')
    } else {
      document.documentElement.removeAttribute('data-theme')
    }
  }

  return (
    <>
      <Button onClick={toggleDarkMode}>
        {isDark ? '☀️' : '🌙'} Toggle Theme
      </Button>
    </>
  )
}
```

## Common Issues & Solutions

### Toast not showing?
Make sure you've included `<ToastContainer>` in your component:
```typescript
<>
  <YourContent />
  <ToastContainer toasts={toast.toasts} onDismiss={toast.dismiss} />
</>
```

### Modal not closing?
Pass the close handler to the close button:
```typescript
<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}  // Required!
>
  Content
</Modal>
```

### Form input not updating?
Make sure to bind both value and onChange:
```typescript
<Input
  value={value}
  onChange={(e) => setValue(e.currentTarget.value)}
/>
```

## Resources

- **Component Gallery**: See `ComponentGallery.tsx` for all components
- **Interactive Demo**: See `ComponentDemo.tsx` for working examples
- **Design System**: `/FrontEnd/src/styles/variables.css`
- **Week 1 Summary**: `WEEK1_IMPLEMENTATION_SUMMARY.md`

## Quick Tips

1. **Always use FormGroup** for better label-input association
2. **Use variant props** instead of custom CSS when possible
3. **Remember dark mode** when styling custom components
4. **Keyboard accessible** - test with Tab key before shipping
5. **Mobile first** - test on 768px breakpoint
6. **Touch targets** - keep buttons/inputs at least 44px tall

## Getting Help

Refer to individual component files:
- See the `*.types.ts` file for prop definitions
- Check `*.module.css` for styling options
- Review `ComponentDemo.tsx` for usage examples
