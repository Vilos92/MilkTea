import {MilkTea} from './milkTea';
import {LocaleProvider} from './providers/locale';
import {PanelProvider} from './providers/panel';
import {SettingsProvider} from './providers/settings';
import {ThemeProvider} from './providers/theme';
import {TranslateProvider} from './providers/translation';

/*
 * MilkTea provider stack.
 */

export function App() {
  return (
    <ThemeProvider>
      <LocaleProvider>
        <TranslateProvider>
          <SettingsProvider>
            <PanelProvider>
              <MilkTea />
            </PanelProvider>
          </SettingsProvider>
        </TranslateProvider>
      </LocaleProvider>
    </ThemeProvider>
  );
}
