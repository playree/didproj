export type EntityStyles = {
  thumbnail?: {
    uri: string
    alt?: string
  }
  hero?: {
    uri: string
    alt?: string
  }
  background?: {
    color?: string
  }
  text?: {
    color?: string
  }
}

export type DisplayMapping = {
  path: unknown // @todo JSONPath
  schema: {
    type: string
  }
  fallback: string
}

export type DataDisplay = {
  title?: DisplayMapping
  subtitle?: DisplayMapping
  description?: DisplayMapping
}

export type OutputDescriptor = {
  id: string
  schema: string
  display: DataDisplay
  styles: EntityStyles
}
