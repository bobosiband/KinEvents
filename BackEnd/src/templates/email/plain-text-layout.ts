/**
 * Plain text email layout wrapper.
 * Simple line-based text, no HTML.
 */
export function renderPlainText(options: { title: string; body: string }): string {
  return `${options.title}

${options.body}

---

KinEvents | Family Events Platform
© 2026 KinEvents. All rights reserved.`
}
