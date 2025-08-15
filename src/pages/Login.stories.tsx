import type { Meta, StoryObj } from '@storybook/react';
import { MemoryRouter } from 'react-router-dom';
import Login from './Login';

const meta: Meta<typeof Login> = {
  title: 'Pages/Auth/Login',
  component: Login,
  decorators: [
    (Story) => (
      <MemoryRouter initialEntries={['/login']}>
        <div style={{ minHeight: '100vh' }}>
          <Story />
        </div>
      </MemoryRouter>
    ),
  ],
  parameters: {
    layout: 'fullscreen',
  },
};
export default meta;

type Story = StoryObj<typeof Login>;

export const Default: Story = {
  args: {},
};

export const Loading: Story = {
  render: () => <Login />,
};