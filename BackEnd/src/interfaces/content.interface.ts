export type ContentBlockKey =
  | 'homepage_title'
  | 'homepage_subtitle'
  | 'homepage_image_url'
  | 'announcement'

export interface IContentBlock {
  key: ContentBlockKey
  value: string
  updatedAt: string
  updatedBy: string
}