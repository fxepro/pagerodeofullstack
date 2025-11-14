// Type declarations for vaul module
declare module 'vaul' {
  import * as React from 'react'

  export interface DrawerProps {
    children?: React.ReactNode
    open?: boolean
    onOpenChange?: (open: boolean) => void
    modal?: boolean
    direction?: 'top' | 'bottom' | 'left' | 'right'
    dismissible?: boolean
    shouldScaleBackground?: boolean
    [key: string]: any
  }

  export const Drawer: {
    Root: React.ComponentType<DrawerProps>
    Trigger: React.ComponentType<any>
    Portal: React.ComponentType<any>
    Overlay: React.ComponentType<any>
    Content: React.ComponentType<any>
    Close: React.ComponentType<any>
    Title: React.ComponentType<any>
    Description: React.ComponentType<any>
    Footer: React.ComponentType<any>
    Handle: React.ComponentType<any>
  }
}

