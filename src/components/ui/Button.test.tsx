import React from 'react'
import { render, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { UiButton } from './button'

describe('Button', () => {
  it('renders and responds to click', () => {
    const onClick = vi.fn()
  const { getByText } = render(<UiButton onClick={onClick}>Click me</UiButton>)
    const btn = getByText('Click me') as HTMLButtonElement
    expect(btn).toBeTruthy()
    fireEvent.click(btn)
    expect(onClick).toHaveBeenCalled()
  })

  it('applies ghost variant styles', () => {
  const { getByText } = render(<UiButton variant="ghost">Ghost</UiButton>)
    const btn = getByText('Ghost')
    expect(btn.className).toContain('bg-transparent')
  })
})
