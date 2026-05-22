import * as vscode from 'vscode';
import { ServiceManager } from './services/ServiceManager';
import { TerminalMonitor } from './terminal/TerminalMonitor';
import { SidebarProvider } from './ui/SidebarProvider';

let terminalMonitor: TerminalMonitor;
let serviceManager: ServiceManager;

export async function activate(context: vscode.ExtensionContext) {
    console.log('TraeGuardian is now active!');

    serviceManager = new ServiceManager(context.extensionPath);
    await serviceManager.start();

    terminalMonitor = new TerminalMonitor();

    const disposable = vscode.commands.registerCommand('traeguardian.helloWorld', () => {
        vscode.window.showInformationMessage('TraeGuardian AI System Online!');
    });

    const openPanel = vscode.commands.registerCommand('traeguardian.openPanel', async () => {
        await vscode.commands.executeCommand('workbench.view.extension.traeguardian-sidebar-view');
    });

    const restartServices = vscode.commands.registerCommand('traeguardian.restartServices', async () => {
        serviceManager.dispose();
        serviceManager = new ServiceManager(context.extensionPath);
        await serviceManager.start();
        vscode.window.showInformationMessage('TraeGuardian services restarted.');
    });

    const sidebarProvider = new SidebarProvider(context.extensionUri, context.extensionPath);
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider('traeguardian.sidebar', sidebarProvider),
        disposable,
        openPanel,
        restartServices,
        { dispose: () => serviceManager?.dispose() }
    );

    vscode.window.showInformationMessage(
        'TraeGuardian is active. Open the TraeGuardian sidebar from the activity bar.'
    );
}

export function deactivate() {
    if (terminalMonitor) {
        terminalMonitor.dispose();
    }
    if (serviceManager) {
        serviceManager.dispose();
    }
}
