import type {Meta, StoryObj} from '@storybook/preact-vite';
import type {ComponentProps} from 'preact';
import {useEffect, useState} from 'preact/hooks';
import {useRef} from 'preact/hooks';

import {getPresetKeys} from '../../lib/butterchurn/butterchurnPresets';
import {Controls} from './controls';

import {controlsStatic} from './controls.css';

/*
 * Types.
 */

type WrapperProps = Pick<
  ComponentProps<typeof Controls>,
  'controlsVisible' | 'isRecording' | 'isFullscreen'
> & {
  showProgress: boolean;
  showTrackInfo: boolean;
  showRecord: boolean;
  showStage: boolean;
  hasStagedPreset: boolean;
  initialIsPlaying: boolean;
};

/*
 * Meta.
 */

const ControlsWrapper = ({
  controlsVisible,
  initialIsPlaying,
  isRecording: initialIsRecording,
  isFullscreen: initialIsFullscreen,
  showProgress,
  showTrackInfo,
  showRecord,
  showStage,
  hasStagedPreset: initialHasStagedPreset
}: WrapperProps) => {
  const swipeRef = useRef<HTMLDivElement>(null);
  const [presetNames, setPresetNames] = useState<string[]>([]);
  const [isPlaying, setIsPlaying] = useState(initialIsPlaying);
  const [isRecording, setIsRecording] = useState(initialIsRecording);
  const [isFullscreen, setIsFullscreen] = useState(initialIsFullscreen);
  const [currentTime, setCurrentTime] = useState(84); // 1:24
  const [stagedPresetName, setStagedPresetName] = useState<string | undefined>(undefined);

  useEffect(() => {
    getPresetKeys()
      .then(keys => {
        setPresetNames(keys);
        if (initialHasStagedPreset) {
          setStagedPresetName(keys[0]);
        }
      })
      .catch(console.error);
  }, [initialHasStagedPreset]);

  return (
    <div
      ref={swipeRef}
      style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        paddingBottom: '40px',
        background: 'linear-gradient(135deg, #0a0a14 0%, #0d1a0d 100%)',
        position: 'relative',
        boxSizing: 'border-box'
      }}
    >
      <Controls
        swipeRef={swipeRef}
        class={controlsStatic}
        isFullscreen={isFullscreen}
        toggleFullscreen={() => setIsFullscreen(v => !v)}
        changePreset={() => {}}
        controlsVisible={controlsVisible}
        onControlsEnter={() => {}}
        onControlsLeave={() => {}}
        trackName={showTrackInfo ? 'Clair de Lune — Claude Debussy' : undefined}
        presetName={showTrackInfo ? 'electric_sheep_23' : undefined}
        filePlayback={
          showProgress
            ? {
                currentTime,
                duration: 222,
                isPlaying,
                onPlayPause: () => setIsPlaying((v: boolean) => !v),
                onSeek: setCurrentTime
              }
            : undefined
        }
        onPrevTrack={() => {}}
        onNextTrack={() => {}}
        isRecording={isRecording}
        isProcessingRecord={false}
        recordProgress={undefined}
        onRecord={showRecord ? () => setIsRecording(v => !v) : undefined}
        hasPresets={showStage && presetNames.length > 0}
        stagedPresetName={stagedPresetName}
        onFireStagedPreset={() => setStagedPresetName(undefined)}
      />
    </div>
  );
};

const meta = {
  title: 'Components/Controls',
  component: Controls,
  parameters: {
    layout: 'fullscreen'
  }
} satisfies Meta<typeof Controls>;

export default meta;

/*
 * Stories.
 */

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <ControlsWrapper
      controlsVisible={true}
      initialIsPlaying={false}
      isRecording={false}
      isFullscreen={false}
      showProgress={true}
      showTrackInfo={true}
      showRecord={true}
      showStage={true}
      hasStagedPreset={false}
    />
  )
};

export const Playing: Story = {
  render: () => (
    <ControlsWrapper
      controlsVisible={true}
      initialIsPlaying={true}
      isRecording={false}
      isFullscreen={false}
      showProgress={true}
      showTrackInfo={true}
      showRecord={true}
      showStage={true}
      hasStagedPreset={false}
    />
  )
};

export const Recording: Story = {
  render: () => (
    <ControlsWrapper
      controlsVisible={true}
      initialIsPlaying={true}
      isRecording={true}
      isFullscreen={false}
      showProgress={true}
      showTrackInfo={true}
      showRecord={true}
      showStage={true}
      hasStagedPreset={false}
    />
  )
};

export const StagedPreset: Story = {
  render: () => (
    <ControlsWrapper
      controlsVisible={true}
      initialIsPlaying={true}
      isRecording={false}
      isFullscreen={false}
      showProgress={true}
      showTrackInfo={true}
      showRecord={true}
      showStage={true}
      hasStagedPreset={true}
    />
  )
};

export const Fullscreen: Story = {
  render: () => (
    <ControlsWrapper
      controlsVisible={true}
      initialIsPlaying={true}
      isRecording={false}
      isFullscreen={true}
      showProgress={true}
      showTrackInfo={true}
      showRecord={false}
      showStage={true}
      hasStagedPreset={false}
    />
  )
};

export const Minimal: Story = {
  render: () => (
    <ControlsWrapper
      controlsVisible={true}
      initialIsPlaying={false}
      isRecording={false}
      isFullscreen={false}
      showProgress={false}
      showTrackInfo={false}
      showRecord={false}
      showStage={false}
      hasStagedPreset={false}
    />
  )
};

export const Hidden: Story = {
  render: () => (
    <ControlsWrapper
      controlsVisible={false}
      initialIsPlaying={false}
      isRecording={false}
      isFullscreen={false}
      showProgress={true}
      showTrackInfo={true}
      showRecord={true}
      showStage={true}
      hasStagedPreset={false}
    />
  )
};
