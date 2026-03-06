import type {RefObject} from 'preact';
import {useCallback, useEffect, useRef, useState} from 'preact/hooks';

import {MilkTeaPanel, usePanelContext} from '../../providers/panel';
import {AudioSource, AudioSourceButtons} from '../audioSourceButtons/audioSourceButtons';
import {CommandPaletteButton} from '../commandPalette/commandPaletteButton';
import {Controls} from '../controls/controls';
import {HelpButton} from '../help/helpButton';
import {
  hudFaded as fadedClass,
  topCorner,
  topLeftCorner,
  topRightCorner,
  hudVisible as visibleClass
} from './hud.css';

/*
 * Types.
 */

type HudProps = {
  started: boolean;
  swipeRef: RefObject<HTMLElement>;
  isCanvasFullscreen: boolean;
  toggleFullscreen: () => void;
  changePreset: (delta: number) => void;
  fileInputRef: RefObject<HTMLInputElement>;
  onFileChange: (event: Event) => void;
  audioSource: AudioSource;
  pendingAudioSource: AudioSource | undefined;
  onSourceChange: (source: AudioSource) => void;
};

/*
 * Constants.
 */

const CONTROLS_FADE_DELAY_MS = 2500;

/*
 * Component.
 */

export function Hud({
  started,
  swipeRef,
  isCanvasFullscreen,
  toggleFullscreen,
  changePreset,
  fileInputRef,
  onFileChange,
  audioSource,
  pendingAudioSource,
  onSourceChange
}: HudProps) {
  const {openPanel, togglePanel} = usePanelContext();
  const {hudVisible, controlsHovered, handleControlsEnter, handleControlsLeave, forceVisible} =
    useHudVisibility();

  useEffect(() => {
    if (openPanel !== MilkTeaPanel.NONE) {
      forceVisible();
    }
  }, [openPanel, forceVisible]);

  useEffect(() => {
    if (!started) {
      document.body.style.cursor = '';
      return;
    }
    document.body.style.cursor = hudVisible ? '' : 'none';
    return () => {
      document.body.style.cursor = '';
    };
  }, [hudVisible, started]);

  const isHudVisible = hudVisible || !started || openPanel !== MilkTeaPanel.NONE;
  const visibilityClass = isHudVisible ? visibleClass : fadedClass;

  return (
    <>
      <CommandPaletteButton
        class={[topCorner, topLeftCorner, visibilityClass].join(' ')}
        alwaysLight={started}
        active={openPanel === MilkTeaPanel.COMMAND_PALETTE}
        onOpen={() => togglePanel(MilkTeaPanel.COMMAND_PALETTE)}
      />
      <AudioSourceButtons
        class={visibilityClass}
        fileInputRef={fileInputRef}
        onFileChange={onFileChange}
        audioSource={audioSource}
        pendingAudioSource={pendingAudioSource}
        started={started}
        onSourceChange={onSourceChange}
      />
      <HelpButton
        class={[topCorner, topRightCorner, visibilityClass].join(' ')}
        alwaysLight={started}
        active={openPanel === MilkTeaPanel.HELP}
        onOpen={() => togglePanel(MilkTeaPanel.HELP)}
      />
      <Controls
        swipeRef={swipeRef}
        isFullscreen={isCanvasFullscreen}
        toggleFullscreen={toggleFullscreen}
        changePreset={changePreset}
        controlsVisible={hudVisible}
        controlsHovered={controlsHovered}
        onControlsEnter={handleControlsEnter}
        onControlsLeave={handleControlsLeave}
      />
    </>
  );
}

/*
 * Hooks.
 */

function useHudVisibility() {
  const [hudVisible, setHudVisible] = useState(true);
  const [controlsHovered, setControlsHovered] = useState(false);
  const fadeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scheduleFadeOutRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const scheduleFadeOut = () => {
      if (fadeTimeoutRef.current) {
        clearTimeout(fadeTimeoutRef.current);
      }
      fadeTimeoutRef.current = setTimeout(() => setHudVisible(false), CONTROLS_FADE_DELAY_MS);
    };
    scheduleFadeOutRef.current = scheduleFadeOut;

    const showControls = () => {
      setHudVisible(true);
      scheduleFadeOut();
    };

    window.addEventListener('mousemove', showControls);
    window.addEventListener('touchstart', showControls, {passive: true});
    scheduleFadeOut();

    return () => {
      window.removeEventListener('mousemove', showControls);
      window.removeEventListener('touchstart', showControls);
      scheduleFadeOutRef.current = null;
      if (fadeTimeoutRef.current) {
        clearTimeout(fadeTimeoutRef.current);
      }
    };
  }, []);

  const handleControlsEnter = () => {
    setControlsHovered(true);
    if (fadeTimeoutRef.current) {
      clearTimeout(fadeTimeoutRef.current);
      fadeTimeoutRef.current = null;
    }
    setHudVisible(true);
    scheduleFadeOutRef.current?.();
  };

  const handleControlsLeave = () => {
    setControlsHovered(false);
    scheduleFadeOutRef.current?.();
  };

  const forceVisible = useCallback(() => {
    setHudVisible(true);
    if (fadeTimeoutRef.current) {
      clearTimeout(fadeTimeoutRef.current);
      fadeTimeoutRef.current = null;
    }
  }, []);

  return {hudVisible, controlsHovered, handleControlsEnter, handleControlsLeave, forceVisible};
}
