import {render} from 'preact';

import {App} from './app.tsx';
import './global.css.ts';

render(<App />, document.getElementById('app')!);
