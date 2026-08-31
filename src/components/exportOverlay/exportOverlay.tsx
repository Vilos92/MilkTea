import {formatTime} from '../../lib/formatTime';
import {useTranslate} from '../../providers/translation';
import {Icon} from '../icon/icon';

import {closeBtnDark, headingDark, headingRow, overlayDark} from '../picker/picker.css';
import {action, actions, panel, percentage, progressFill, progressTrack, time} from './exportOverlay.css';

/*
 * Types.
 */

type ExportOverlayProps = {
  progress: number;
  duration: number;
  isFinishing: boolean;
  onCancel: () => void;
  onClose: () => void;
  download: {url: string; filename: string} | undefined;
};

/*
 * Component.
 */

export function ExportOverlay({
  progress,
  duration,
  isFinishing,
  onCancel,
  onClose,
  download
}: ExportOverlayProps) {
  const t = useTranslate();
  const percent = Math.round(progress * 100);
  let status = 'Rendering full track';
  if (isFinishing) {
    status = 'Finishing export…';
  }
  if (download) {
    status = 'Export complete';
  }

  return (
    <div class={overlayDark} role="dialog" aria-modal="true" aria-labelledby="export-title">
      <section class={panel}>
        <div class={headingRow}>
          <h2 id="export-title" class={headingDark}>
            {status}
          </h2>
          {download && (
            <button
              type="button"
              class={closeBtnDark}
              onClick={onClose}
              aria-label={t('common.close')}
              title={t('common.close')}
            >
              <Icon type="close" size="sm" />
            </button>
          )}
        </div>
        {download ? (
          <div class={actions}>
            <a class={action} href={download.url} download={download.filename}>
              Download {download.filename}
            </a>
            <button type="button" class={action} onClick={onClose}>
              {t('common.close')}
            </button>
          </div>
        ) : (
          <>
            <p class={percentage}>{percent}%</p>
            <div class={progressTrack}>
              <div class={progressFill} style={{width: `${percent}%`}} />
            </div>
            <p class={time}>
              {formatTime(duration * progress)} / {formatTime(duration)}
            </p>
            {!isFinishing && (
              <div class={actions}>
                <button class={action} type="button" onClick={onCancel}>
                  Cancel export
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
