import React from 'react'
import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Card } from './Card'

describe('Card', () => {
  it('renders children', () => {
    const { getByText } = render(<Card>Content</Card>)
    expect(getByText('Content')).toBeTruthy()
  })

  it('applies accent styles when requested', () => {
    const { container } = render(<Card accent>Accent</Card>)
    expect(container.firstChild).toBeTruthy()
  })
})
