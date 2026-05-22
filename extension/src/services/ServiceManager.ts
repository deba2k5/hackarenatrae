import * as child_process from 'child_process';
import * as fs from 'fs';
import * as http from 'http';
import * as path from 'path';
import * as vscode from 'vscode';

export class ServiceManager {
    private backendProcess?: child_process.ChildProcess;
    private frontendProcess?: child_process.ChildProcess;
    private readonly workspaceRoot: string;

    constructor(extensionPath: string) {
        this.workspaceRoot = path.dirname(path.dirname(extensionPath));
    }

    async start(): Promise<void> {
        const config = vscode.workspace.getConfiguration('traeguardian');
        if (!config.get<boolean>('autoStartServices', true)) {
            return;
        }

        const backendPort = config.get<number>('backendPort', 8000);
        const frontendPort = config.get<number>('frontendPort', 5173);

        await this.startBackend(backendPort);
        await this.startFrontend(frontendPort);
    }

    private resolvePython(backendDir: string): { cmd: string; args: string[] } {
        const venvPython = process.platform === 'win32'
            ? path.join(backendDir, 'venv', 'Scripts', 'python.exe')
            : path.join(backendDir, 'venv', 'bin', 'python');

        if (fs.existsSync(venvPython)) {
            return { cmd: venvPython, args: [] };
        }
        const systemPy = 'C:\\Python313\\python.exe';
        if (process.platform === 'win32' && fs.existsSync(systemPy)) {
            return { cmd: systemPy, args: [] };
        }
        if (process.platform === 'win32') {
            return { cmd: 'py', args: ['-3.13'] };
        }
        return { cmd: 'python3', args: [] };
    }

    private async startBackend(port: number): Promise<void> {
        if (await this.isPortOpen(port, '/health')) {
            return;
        }

        const backendDir = path.join(this.workspaceRoot, 'backend');
        const { cmd, args } = this.resolvePython(backendDir);
        const spawnArgs = [
            ...args,
            '-m',
            'uvicorn',
            'main:app',
            '--host',
            '127.0.0.1',
            '--port',
            String(port),
        ];

        this.backendProcess = child_process.spawn(cmd, spawnArgs, {
            cwd: backendDir,
            shell: process.platform === 'win32',
            env: { ...process.env },
        });

        this.backendProcess.stderr?.on('data', (data) => {
            console.log(`[TraeGuardian Backend] ${data.toString()}`);
        });

        await this.waitForPort(port, '/health', 300000);
        vscode.window.setStatusBarMessage('TraeGuardian: AI backend online', 3000);
    }

    private async startFrontend(port: number): Promise<void> {
        if (await this.isPortOpen(port, '/')) {
            return;
        }

        const frontendDir = path.join(this.workspaceRoot, 'frontend');
        const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';

        this.frontendProcess = child_process.spawn(
            npmCmd,
            ['run', 'dev', '--', '--host', '127.0.0.1', '--port', String(port), '--strictPort'],
            { cwd: frontendDir, shell: process.platform === 'win32', env: { ...process.env } }
        );

        await this.waitForPort(port, '/', 60000);
        vscode.window.setStatusBarMessage('TraeGuardian: UI dev server online', 3000);
    }

    private isPortOpen(port: number, urlPath = '/'): Promise<boolean> {
        return new Promise((resolve) => {
            const req = http.get(`http://127.0.0.1:${port}${urlPath}`, () => resolve(true));
            req.on('error', () => resolve(false));
            req.setTimeout(1500, () => {
                req.destroy();
                resolve(false);
            });
        });
    }

    private waitForPort(port: number, urlPath: string, timeoutMs: number): Promise<void> {
        const start = Date.now();
        return new Promise((resolve) => {
            const check = async () => {
                if (await this.isPortOpen(port, urlPath)) {
                    resolve();
                    return;
                }
                if (Date.now() - start > timeoutMs) {
                    vscode.window.showWarningMessage(
                        `TraeGuardian: port ${port} not ready. First launch downloads ML models — run backend manually if needed.`
                    );
                    resolve();
                    return;
                }
                setTimeout(check, 1000);
            };
            check();
        });
    }

    dispose(): void {
        this.backendProcess?.kill();
        this.frontendProcess?.kill();
        this.backendProcess = undefined;
        this.frontendProcess = undefined;
    }
}
