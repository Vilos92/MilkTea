import {MilkTea} from './milkTea';
import {LocaleProvider} from './providers/locale';
import {PanelProvider} from './providers/panel';
import {SettingsProvider} from './providers/settings';
import {TranslateProvider} from './providers/translation';

/*
 * MilkTea provider stack.
 */

export function App() {
  return (
    <LocaleProvider>
      <TranslateProvider>
        <SettingsProvider>
          <PanelProvider>
            <MilkTea />
          </PanelProvider>
        </SettingsProvider>
      </TranslateProvider>
    </LocaleProvider>
  );
}
