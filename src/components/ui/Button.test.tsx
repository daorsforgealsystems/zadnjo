import React from 'react'
import { render, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { Button } from './Button'

describe('Button', () => {
  it('renders and responds to click', () => {
    const onClick = vi.fn()
    const { getByText } = render(<Button onClick={onClick}>Click me</Button>)
    const btn = getByText('Click me') as HTMLButtonElement
    expect(btn).toBeTruthy()
    fireEvent.click(btn)
    expect(onClick).toHaveBeenCalled()
  })

  it('applies ghost variant styles', () => {
    const { getByText } = render(<Button variant="ghost">Ghost</Button>)
    const btn = getByText('Ghost')
    expect(btn.className).toContain('bg-transparent')
  })
})
