import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export class SidebarProvider implements vscode.WebviewViewProvider {
    _view?: vscode.WebviewView;

    constructor(
        private readonly _extensionUri: vscode.Uri,
        private readonly _extensionPath: string
    ) {}

    public resolveWebviewView(webviewView: vscode.WebviewView) {
        this._view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [
                this._extensionUri,
                vscode.Uri.file(path.join(this._extensionPath, 'media', 'webview')),
            ],
        };

        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

        webviewView.webview.onDidReceiveMessage(async (data) => {
            switch (data.type) {
                case 'onInfo': {
                    if (!data.value) {
                        return;
                    }
                    vscode.window.showInformationMessage(data.value);
                    break;
                }
                case 'onError': {
                    if (!data.value) {
                        return;
                    }
                    vscode.window.showErrorMessage(data.value);
                    break;
                }
            }
        });
    }

    private _getHtmlForWebview(webview: vscode.Webview) {
        const config = vscode.workspace.getConfiguration('traeguardian');
        const useDevServer = config.get<boolean>('useDevServer', true);
        const backendPort = config.get<number>('backendPort', 8000);
        const frontendPort = config.get<number>('frontendPort', 5173);
        const wsUrl = `ws://127.0.0.1:${backendPort}/ws`;

        const webviewDist = path.join(this._extensionPath, 'media', 'webview', 'index.html');
        const hasBundledUi = fs.existsSync(webviewDist);

        if (!useDevServer && hasBundledUi) {
            return this._getBundledHtml(webview, wsUrl);
        }

        const devUrl = `http://127.0.0.1:${frontendPort}`;
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; frame-src ${devUrl} http://127.0.0.1:* http://localhost:*; script-src 'unsafe-inline'; style-src 'unsafe-inline';">
    <title>TraeGuardian</title>
    <style>
        body, html { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; background: #0a0a0f; }
        iframe { width: 100%; height: 100%; border: none; }
        .loading { color: #00f0ff; font-family: sans-serif; padding: 16px; font-size: 12px; }
    </style>
</head>
<body>
    <div class="loading" id="status">Connecting to TraeGuardian UI...</div>
    <iframe id="app" src="${devUrl}" allow="clipboard-read; clipboard-write" style="display:none"></iframe>
    <script>
        const vscodeApi = acquireVsCodeApi();
        window.TRAEGUARDIAN_CONFIG = { wsUrl: '${wsUrl}', apiUrl: 'http://127.0.0.1:${backendPort}' };
        const iframe = document.getElementById('app');
        const status = document.getElementById('status');
        iframe.onload = () => {
            status.style.display = 'none';
            iframe.style.display = 'block';
            try {
                iframe.contentWindow.TRAEGUARDIAN_CONFIG = window.TRAEGUARDIAN_CONFIG;
            } catch (e) {}
        };
        iframe.onerror = () => {
            status.textContent = 'UI server not ready. Run: npm run dev (in frontend) or enable traeguardian.autoStartServices.';
        };
        window.addEventListener('message', event => {
            if (event.data && typeof event.data === 'object') {
                vscodeApi.postMessage(event.data);
            }
        });
    </script>
</body>
</html>`;
    }

    private _getBundledHtml(webview: vscode.Webview, wsUrl: string) {
        const distUri = vscode.Uri.file(path.join(this._extensionPath, 'media', 'webview'));
        const indexPath = path.join(this._extensionPath, 'media', 'webview', 'index.html');
        let html = fs.readFileSync(indexPath, 'utf8');

        const configScript = `<script>window.TRAEGUARDIAN_CONFIG={wsUrl:'${wsUrl}',apiUrl:'http://127.0.0.1:8000'};</script>`;
        html = html.replace('<head>', `<head>${configScript}`);

        html = html.replace(/(href|src)="\/([^"]+)"/g, (_match, attr, assetPath) => {
            const assetUri = webview.asWebviewUri(vscode.Uri.joinPath(distUri, assetPath));
            return `${attr}="${assetUri}"`;
        });

        const csp = [
            `default-src 'none'`,
            `style-src ${webview.cspSource} 'unsafe-inline'`,
            `script-src ${webview.cspSource} 'unsafe-inline'`,
            `img-src ${webview.cspSource} https: data:`,
            `font-src ${webview.cspSource}`,
            `connect-src ws://127.0.0.1:* ws://localhost:* http://127.0.0.1:* http://localhost:*`,
        ].join('; ');

        return html.replace('<head>', `<head><meta http-equiv="Content-Security-Policy" content="${csp}">`);
    }
}
