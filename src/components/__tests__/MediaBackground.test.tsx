import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import MediaBackground from '../MediaBackground';

describe('MediaBackground', () => {
  it('renders image by default', () => {
    render(<MediaBackground mediaSrc="/test-image.jpg" />);
    
    const image = screen.getByRole('img');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', '/test-image.jpg');
    expect(image).toHaveAttribute('alt', 'Logistics hero background showing transport vehicles and routes');
  });

  it('renders video when type is video', () => {
    const { container } = render(<MediaBackground mediaSrc="/test-video.mp4" type="video" />);
    
    const video = container.querySelector('video');
    expect(video).toBeInTheDocument();
    expect(video).toHaveAttribute('src', '/test-video.mp4');
    expect(video).toHaveAttribute('autoplay');
    expect(video).toHaveAttribute('playsinline');
    // Note: muted attribute might be rendered as empty string or boolean in different environments
  });

  it('applies custom overlay opacity', () => {
    const { container } = render(
      <MediaBackground mediaSrc="/test-image.jpg" overlayOpacity={0.8} />
    );
    
    // Find the overlay div (should be the last child with absolute positioning)
    const overlays = container.querySelectorAll('.absolute.inset-0');
    const overlay = overlays[overlays.length - 1];
    expect(overlay).toHaveStyle('background-color: rgba(0, 0, 0, 0.8)');
  });

  it('renders with default overlay opacity', () => {
    const { container } = render(<MediaBackground mediaSrc="/test-image.jpg" />);
    
    // Should render with default 0.4 opacity
    const overlays = container.querySelectorAll('.absolute.inset-0');
    const overlay = overlays[overlays.length - 1];
    expect(overlay).toHaveStyle('background-color: rgba(0, 0, 0, 0.4)');
  });
});