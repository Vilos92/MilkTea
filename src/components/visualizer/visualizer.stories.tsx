import type {Meta, StoryObj} from '@storybook/preact';

import {useButterchurn} from '../../hooks/useButterchurn';
import {Visualizer} from './visualizer';

/*
 * Meta.
 */

const VisualizerWrapper = () => {
  const {canvasRef, presetName} = useButterchurn();
  return <Visualizer canvasRef={canvasRef} presetName={presetName} trackName={undefined} />;
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
