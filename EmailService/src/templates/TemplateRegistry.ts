import { NotFoundError } from '../errors/DomainError'
import { AccessApprovedTemplate } from './AccessApprovedTemplate'
import { AccessRejectedTemplate } from './AccessRejectedTemplate'
import { AccessRequestTemplate } from './AccessRequestTemplate'
import { AccountUpdatedTemplate } from './AccountUpdatedTemplate'
import { AnnouncementTemplate } from './AnnouncementTemplate'
import { BaseEmailTemplate } from './BaseEmailTemplate'
import { BirthdayReminderTemplate } from './BirthdayReminderTemplate'
import { BirthdayTodayTemplate } from './BirthdayTodayTemplate'
import { EventCancelledTemplate } from './EventCancelledTemplate'
import { EventCreatedTemplate } from './EventCreatedTemplate'
import { EventReminderTemplate } from './EventReminderTemplate'
import { EventUpdatedTemplate } from './EventUpdatedTemplate'
import { LoginPinTemplate } from './LoginPinTemplate'
import { NewDeviceAlertTemplate } from './NewDeviceAlertTemplate'
import { RoleChangedTemplate } from './RoleChangedTemplate'
import { RsvpConfirmationTemplate } from './RsvpConfirmationTemplate'
import { WelcomeTemplate } from './WelcomeTemplate'

export class TemplateRegistry {
  private readonly byName: Map<string, BaseEmailTemplate>

  public constructor(templates: readonly BaseEmailTemplate[]) {
    this.byName = new Map(templates.map((template) => [template.name, template]))
  }

  public static default(): TemplateRegistry {
    return new TemplateRegistry([
      new WelcomeTemplate(),
      new AccessApprovedTemplate(),
      new AccessRejectedTemplate(),
      new AccessRequestTemplate(),
      new AccountUpdatedTemplate(),
      new RoleChangedTemplate(),
      new EventCreatedTemplate(),
      new EventUpdatedTemplate(),
      new EventCancelledTemplate(),
      new EventReminderTemplate(),
      new RsvpConfirmationTemplate(),
      new BirthdayTodayTemplate(),
      new BirthdayReminderTemplate(),
      new AnnouncementTemplate(),
      new LoginPinTemplate(),
      new NewDeviceAlertTemplate(),
    ])
  }

  public get(name: string): BaseEmailTemplate {
    const template = this.byName.get(name)
    if (!template) {
      throw new NotFoundError(`Unknown email template: ${name}`)
    }
    return template
  }

  public has(name: string): boolean {
    return this.byName.has(name)
  }

  public names(): readonly string[] {
    return Array.from(this.byName.keys())
  }
}
