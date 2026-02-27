import {render} from 'preact';

import {App} from './app';
import './global.css.ts';

render(<App />, document.getElementById('app')!);
