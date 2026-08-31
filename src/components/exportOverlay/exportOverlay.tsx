import type {OfflineExportState} from '../../hooks/offlineExportTypes';
import {formatTime} from '../../lib/formatTime';
import {useTranslate} from '../../providers/translation';
import {Icon} from '../icon/icon';

import {closeBtnDark, headingDark, headingRow, overlayDark} from '../picker/picker.css';
import {action, actions, panel, percentage, progressFill, progressTrack, time} from './exportOverlay.css';

/*
 * Types.
 */

type ExportDownload = {url: string; filename: string};

type ExportOverlayProps = {
  progress: number;
  duration: number;
  state: OfflineExportState;
  onCancel: () => void;
  onRetry: () => void;
  onClose: () => void;
  download: ExportDownload | undefined;
};

type CloseButtonProps = {
  onClose: () => void;
  label: string;
};

type ExportDownloadActionsProps = {
  download: ExportDownload;
  onClose: () => void;
};

type ExportProgressProps = {
  progress: number;
  duration: number;
  state: OfflineExportState;
  onCancel: () => void;
};

type ExportErrorActionsProps = {
  onRetry: () => void;
  onClose: () => void;
};

type CancelButtonProps = {
  onCancel: () => void;
};

/*
 * Component.
 */

export function ExportOverlay({
  progress,
  duration,
  state,
  onCancel,
  onRetry,
  onClose,
  download
}: ExportOverlayProps) {
  const t = useTranslate();
  const statusByState: Record<OfflineExportState, string> = {
    idle: t('export.rendering'),
    preparing: t('export.rendering'),
    rendering: t('export.rendering'),
    cancelling: t('export.cancelling'),
    finishing: t('export.finishing'),
    error: t('export.failed')
  };
  const status = download ? t('export.complete') : statusByState[state];

  return (
    <div class={overlayDark} role="dialog" aria-modal="true" aria-labelledby="export-title">
      <section class={panel}>
        <div class={headingRow}>
          <h2 id="export-title" class={headingDark}>
            {status}
          </h2>
          {(download || state === 'error') && <CloseButton onClose={onClose} label={t('common.close')} />}
        </div>
        <ExportBody
          progress={progress}
          duration={duration}
          state={state}
          onCancel={onCancel}
          onRetry={onRetry}
          onClose={onClose}
          download={download}
        />
      </section>
    </div>
  );
}

function ExportBody({progress, duration, state, onCancel, onRetry, onClose, download}: ExportOverlayProps) {
  if (download) {
    return <ExportDownloadActions download={download} onClose={onClose} />;
  }
  if (state === 'error') {
    return <ExportErrorActions onRetry={onRetry} onClose={onClose} />;
  }
  return <ExportProgress progress={progress} duration={duration} state={state} onCancel={onCancel} />;
}

function CloseButton({onClose, label}: CloseButtonProps) {
  return (
    <button type="button" class={closeBtnDark} onClick={onClose} aria-label={label} title={label}>
      <Icon type="close" size="sm" />
    </button>
  );
}

function ExportDownloadActions({download, onClose}: ExportDownloadActionsProps) {
  const t = useTranslate();
  return (
    <div class={actions}>
      <a class={action} href={download.url} download={download.filename}>
        {t('export.download')} {download.filename}
      </a>
      <button type="button" class={action} onClick={onClose}>
        {t('common.close')}
      </button>
    </div>
  );
}

function ExportProgress({progress, duration, state, onCancel}: ExportProgressProps) {
  const percent = Math.round(progress * 100);
  const canCancel = state === 'preparing' || state === 'rendering';
  return (
    <>
      <p class={percentage}>{percent}%</p>
      <div class={progressTrack}>
        <div class={progressFill} style={{width: `${percent}%`}} />
      </div>
      <p class={time}>
        {formatTime(duration * progress)} / {formatTime(duration)}
      </p>
      {canCancel && <CancelButton onCancel={onCancel} />}
    </>
  );
}

function ExportErrorActions({onRetry, onClose}: ExportErrorActionsProps) {
  const t = useTranslate();
  return (
    <div class={actions}>
      <button class={action} type="button" onClick={onRetry}>
        {t('export.retry')}
      </button>
      <button class={action} type="button" onClick={onClose}>
        {t('common.close')}
      </button>
    </div>
  );
}

function CancelButton({onCancel}: CancelButtonProps) {
  const t = useTranslate();
  return (
    <div class={actions}>
      <button class={action} type="button" onClick={onCancel}>
        {t('export.cancel')}
      </button>
    </div>
  );
}
