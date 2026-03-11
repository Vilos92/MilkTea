import type {Meta, StoryObj} from '@storybook/preact-vite';

import {useButterchurn} from '../../hooks/useButterchurn';
import {Visualizer} from './visualizer';

/*
 * Meta.
 */

const VisualizerWrapper = () => {
  const {canvasRef} = useButterchurn();
  return <Visualizer canvasRef={canvasRef} />;
};

const meta = {
  title: 'Components/Visualizer',
  component: Visualizer,
  render: () => <VisualizerWrapper />
} satisfies Meta<typeof Visualizer>;

export default meta;

/*
 * Stories.
 */

type Story = StoryObj<typeof meta>;

export const Basic: Story = {};
