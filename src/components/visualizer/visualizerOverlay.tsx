import {useEffect, useState} from 'preact/hooks';

import {useSettingsContext} from '../../providers/settings';
import {faded, presetNameNotify, trackNameNotify, visualizerOverlay} from './visualizerOverlay.css';

/*
 * Types.
 */

export type VisualizerOverlayProps = {
  presetName: string | undefined;
  trackName: string | undefined;
};

/*
 * Component.
 */

export function VisualizerOverlay({presetName, trackName}: VisualizerOverlayProps) {
  const {shouldShowPresetName, shouldShowTrackName} = useSettingsContext();

  const [displayedPreset, setDisplayedPreset] = useState<string | undefined>(undefined);
  const [isPresetFading, setIsPresetFading] = useState(false);
  const [displayedTrack, setDisplayedTrack] = useState<string | undefined>(undefined);
  const [isTrackFading, setIsTrackFading] = useState(false);

  useEffect(() => {
    if (presetName === undefined) return;
    setDisplayedPreset(presetName);

    setIsPresetFading(false);
    const fadeId = setTimeout(() => setIsPresetFading(true), 2000);
    const clearId = setTimeout(() => setDisplayedPreset(undefined), 2500);

    return () => {
      clearTimeout(fadeId);
      clearTimeout(clearId);
    };
  }, [presetName]);

  const handlePresetNameTransitionEnd = () => {
    if (isPresetFading) setDisplayedPreset(undefined);
  };

  useEffect(() => {
    if (trackName === undefined) return;
    setDisplayedTrack(trackName);

    setIsTrackFading(false);
    const fadeId = setTimeout(() => setIsTrackFading(true), 2000);
    const clearId = setTimeout(() => setDisplayedTrack(undefined), 2500);

    return () => {
      clearTimeout(fadeId);
      clearTimeout(clearId);
    };
  }, [trackName]);

  const handleTrackNameTransitionEnd = () => {
    if (isTrackFading) setDisplayedTrack(undefined);
  };

  const trackNameClass = displayedTrack
    ? [trackNameNotify, isTrackFading ? faded : ''].filter(Boolean).join(' ')
    : '';
  const presetClass = displayedPreset
    ? [presetNameNotify, isPresetFading ? faded : ''].filter(Boolean).join(' ')
    : '';

  return (
    <div class={visualizerOverlay}>
      {shouldShowTrackName && displayedTrack && (
        <div
          class={trackNameClass}
          onTransitionEnd={handleTrackNameTransitionEnd}
          role="status"
          aria-live="polite"
        >
          {displayedTrack}
        </div>
      )}
      {shouldShowPresetName && displayedPreset && (
        <div
          class={presetClass}
          onTransitionEnd={handlePresetNameTransitionEnd}
          role="status"
          aria-live="polite"
        >
          {displayedPreset}
        </div>
      )}
    </div>
  );
}
