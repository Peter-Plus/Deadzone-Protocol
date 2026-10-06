export interface AssetEntry { name: string; relative: string; path: string }
export class AssetBrowser {
  models: AssetEntry[] = []; animations: AssetEntry[] = [];
  selectedModel = ''; selectedAnimation = '';
  onModel = (_path: string) => {}; onAnimation = (_path: string) => {};
  constructor(private modelList: HTMLElement, private animationList: HTMLElement) {}
  async refresh() {
    const get = async (kind: string): Promise<AssetEntry[]> => { const r = await fetch(`/api/assets/${kind}`); if (!r.ok) throw new Error('Asset API unavailable'); return r.json(); };
    [this.models, this.animations] = await Promise.all([get('models'), get('animations')]); this.render();
  }
  render() {
    const fill = (host: HTMLElement, entries: AssetEntry[], selected: string, choose: (path: string) => void, none: boolean) => {
      host.replaceChildren();
      for (const entry of [...(none ? [{ name: 'None · 参考姿势', relative: '', path: '' }] : []), ...entries]) {
        const button = document.createElement('button'); button.className = 'asset' + (selected === entry.path ? ' selected' : ''); button.textContent = entry.name; button.title = entry.relative; button.setAttribute('aria-pressed', String(selected === entry.path));
        button.onclick = () => choose(entry.path); host.append(button);
      }
      if (!entries.length && !none) { const empty = document.createElement('p'); empty.className = 'muted'; empty.textContent = '暂无模型，请先编译资产。'; host.append(empty); }
    };
    fill(this.modelList, this.models, this.selectedModel, path => { this.selectedModel = path; this.render(); this.onModel(path); }, false);
    fill(this.animationList, this.animations, this.selectedAnimation, path => { this.selectedAnimation = path; this.render(); this.onAnimation(path); }, true);
    document.querySelector('#model-count')!.textContent = String(this.models.length);
    document.querySelector('#animation-count')!.textContent = String(this.animations.length);
  }
}
