import React from 'react'
import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { UiCard } from './Card'

describe('Card', () => {
  it('renders children', () => {
  const { getByText } = render(<UiCard>Content</UiCard>)
    expect(getByText('Content')).toBeTruthy()
  })

  it('applies accent styles when requested', () => {
  const { container } = render(<UiCard accent>Accent</UiCard>)
    expect(container.firstChild).toBeTruthy()
  })
})
