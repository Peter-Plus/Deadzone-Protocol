import foundation from './config/foundation.json';
import { parseConfig } from './config/config.js';
import { Application } from './app/application.js';
import range from './config/range.json';
import { parseRangeConfig } from './config/range-config.js';
import { RangeApplication } from './app/range-application.js';
import './styles.css';
import './range.css';

const root = document.getElementById('app');
if (!root) throw new Error('缺少 #app 根节点');
async function start(root: HTMLElement): Promise<void> {
  try {
    const app = location.hash === '#foundation' ? new Application(root, parseConfig(foundation)) : await RangeApplication.create(root, parseRangeConfig(range));
    window.addEventListener('pagehide', (event) => { if (!event.persisted) app.dispose(); });
    window.addEventListener('hashchange', () => location.reload());
  } catch (error) {
    const title = document.createElement('h1'); title.textContent = '场景启动失败';
    const detail = document.createElement('p');
    detail.textContent = `${error instanceof Error ? error.message : String(error)}。请检查配置，或使用支持 WebGL 2 / WebAssembly 的浏览器。`;
    root.replaceChildren(title, detail); console.error(error);
  }
}
void start(root);
