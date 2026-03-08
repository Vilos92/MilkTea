import type {Meta, StoryObj} from '@storybook/preact-vite';

import {MediabunnyDemo} from './mediabunnyDemo';

/*
 * Meta.
 */

const meta = {
  title: 'Components/MediabunnyDemo',
  component: MediabunnyDemo
} satisfies Meta<typeof MediabunnyDemo>;

export default meta;

/*
 * Stories.
 */

type Story = StoryObj<typeof meta>;

export const Basic: Story = {};
