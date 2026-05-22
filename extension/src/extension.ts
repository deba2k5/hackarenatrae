import * as vscode from 'vscode';
import { ServiceManager } from './services/ServiceManager';
import { TerminalMonitor } from './terminal/TerminalMonitor';
import { SidebarProvider } from './ui/SidebarProvider';

let terminalMonitor: TerminalMonitor;
let serviceManager: ServiceManager;
let sidebarProvider: SidebarProvider;

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

    const analyzeSelectedText = vscode.commands.registerCommand('traeguardian.analyzeSelection', async () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            const selection = editor.selection;
            const text = editor.document.getText(selection);
            if (text.trim()) {
                terminalMonitor.analyzeError(text);
                // Send the error to the sidebar
                if (sidebarProvider) {
                    sidebarProvider.sendErrorToWebview(text);
                }
            } else {
                vscode.window.showWarningMessage('Please select some error text first.');
            }
        }
    });

    const captureTerminal = vscode.commands.registerCommand('traeguardian.captureTerminal', async () => {
        const output = terminalMonitor.captureActiveTerminal();
        if (output.trim() && sidebarProvider) {
            sidebarProvider.sendErrorToWebview(output);
        }
    });

    sidebarProvider = new SidebarProvider(context.extensionUri, context.extensionPath);
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider('traeguardian.sidebar', sidebarProvider),
        disposable,
        openPanel,
        restartServices,
        analyzeSelectedText,
        captureTerminal,
        { dispose: () => serviceManager?.dispose() }
    );

    vscode.window.showInformationMessage(
        'TraeGuardian is active. Open the TraeGuardian sidebar from the activity bar or select text and run "TraeGuardian: Analyze Selection".'
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

// Extend SidebarProvider to add sendErrorToWebview
declare module './ui/SidebarProvider' {
    interface SidebarProvider {
        sendErrorToWebview(error: string): void;
    }
}
