import type {Meta, StoryObj} from '@storybook/preact-vite';

import {useButterchurn} from '../../hooks/useButterchurn';
import {Visualizer} from './visualizer';

/*
 * Types.
 */

type Story = StoryObj<typeof meta>;

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

export const Basic: Story = {};
