import {formatTime} from '../../lib/formatTime';
import {useTranslate} from '../../providers/translation';
import {Icon} from '../icon/icon';

import {closeBtnDark, headingDark, headingRow, overlayDark} from '../picker/picker.css';
import {action, actions, panel, percentage, progressFill, progressTrack, time} from './exportOverlay.css';

type ExportDownload = {url: string; filename: string};

type ExportOverlayProps = {
  progress: number;
  duration: number;
  isFinishing: boolean;
  isCancelling: boolean;
  onCancel: () => void;
  onClose: () => void;
  download: ExportDownload | undefined;
};

export function ExportOverlay({
  progress,
  duration,
  isFinishing,
  isCancelling,
  onCancel,
  onClose,
  download
}: ExportOverlayProps) {
  const t = useTranslate();
  const status = getExportStatus(download, isFinishing, isCancelling);

  return (
    <div class={overlayDark} role="dialog" aria-modal="true" aria-labelledby="export-title">
      <section class={panel}>
        <div class={headingRow}>
          <h2 id="export-title" class={headingDark}>
            {status}
          </h2>
          {download && <CloseButton onClose={onClose} label={t('common.close')} />}
        </div>
        {download ? (
          <ExportDownloadActions download={download} onClose={onClose} />
        ) : (
          <ExportProgress
            progress={progress}
            duration={duration}
            isFinishing={isFinishing}
            isCancelling={isCancelling}
            onCancel={onCancel}
          />
        )}
      </section>
    </div>
  );
}

function CloseButton({onClose, label}: {onClose: () => void; label: string}) {
  return (
    <button type="button" class={closeBtnDark} onClick={onClose} aria-label={label} title={label}>
      <Icon type="close" size="sm" />
    </button>
  );
}

function ExportDownloadActions({download, onClose}: {download: ExportDownload; onClose: () => void}) {
  const t = useTranslate();
  return (
    <div class={actions}>
      <a class={action} href={download.url} download={download.filename}>
        Download {download.filename}
      </a>
      <button type="button" class={action} onClick={onClose}>
        {t('common.close')}
      </button>
    </div>
  );
}

type ExportProgressProps = {
  progress: number;
  duration: number;
  isFinishing: boolean;
  isCancelling: boolean;
  onCancel: () => void;
};

function ExportProgress({progress, duration, isFinishing, isCancelling, onCancel}: ExportProgressProps) {
  const percent = Math.round(progress * 100);
  const canCancel = !isFinishing && !isCancelling;
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

function CancelButton({onCancel}: {onCancel: () => void}) {
  return (
    <div class={actions}>
      <button class={action} type="button" onClick={onCancel}>
        Cancel export
      </button>
    </div>
  );
}

function getExportStatus(
  download: ExportDownload | undefined,
  isFinishing: boolean,
  isCancelling: boolean
): string {
  if (download) {
    return 'Export complete';
  }
  if (isCancelling) {
    return 'Cancelling export…';
  }
  if (isFinishing) {
    return 'Finishing export…';
  }
  return 'Rendering full track';
}
