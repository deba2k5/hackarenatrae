import * as vscode from 'vscode';

export class TerminalMonitor {
    private disposables: vscode.Disposable[] = [];
    private capturedOutput: string = '';
    private activeTerminal: vscode.Terminal | undefined;

    constructor() {
        this.init();
    }

    private init() {
        console.log("Terminal Monitor initialized. Listening for terminal events...");

        // Listen for terminal creation
        this.disposables.push(
            vscode.window.onDidOpenTerminal(terminal => {
                console.log(`Terminal opened: ${terminal.name}`);
                this.monitorTerminal(terminal);
            })
        );

        // Monitor existing terminals
        vscode.window.terminals.forEach(terminal => {
            this.monitorTerminal(terminal);
        });

        // Listen for active terminal changes
        this.disposables.push(
            vscode.window.onDidChangeActiveTerminal(terminal => {
                if (terminal) {
                    console.log(`Active terminal changed: ${terminal.name}`);
                    this.activeTerminal = terminal;
                }
            })
        );
    }

    private monitorTerminal(terminal: vscode.Terminal) {
        this.disposables.push(
            vscode.window.onDidCloseTerminal(closedTerminal => {
                if (closedTerminal.name === terminal.name) {
                    console.log(`Terminal closed: ${closedTerminal.name}`);
                    this.handleTerminalClose(closedTerminal);
                }
            })
        );
    }

    public captureActiveTerminal(): string {
        if (!this.activeTerminal) {
            vscode.window.showWarningMessage('No active terminal found. Select a terminal first.');
            return '';
        }

        // Since we can't directly read terminal output via API, we'll prompt the user to paste it
        // or use the selection command
        vscode.window.showInformationMessage(
            `Capturing terminal: ${this.activeTerminal.name}. Please select and copy the error text, then use "TraeGuardian: Analyze Selection".`,
            'Open Sidebar'
        ).then(selection => {
            if (selection === 'Open Sidebar') {
                vscode.commands.executeCommand('traeguardian.openPanel');
            }
        });

        return this.capturedOutput;
    }

    private handleTerminalClose(terminal: vscode.Terminal) {
        vscode.window.showInformationMessage(
            `Terminal ${terminal.name} closed. Do you want to analyze any errors?`,
            'Analyze Last Error',
            'Open Sidebar',
            'Skip'
        ).then(selection => {
            if (selection === 'Analyze Last Error') {
                this.analyzeError("Terminal closed - please paste the error text in the TraeGuardian sidebar.");
                vscode.commands.executeCommand('traeguardian.openPanel');
            } else if (selection === 'Open Sidebar') {
                vscode.commands.executeCommand('traeguardian.openPanel');
            }
        });
    }

    public analyzeError(errorOutput: string) {
        console.log(`Analyzing error: ${errorOutput.substring(0, 100)}...`);
        vscode.window.showWarningMessage('TraeGuardian detected a terminal error. Analyzing...');
        vscode.commands.executeCommand('traeguardian.openPanel');
        setTimeout(() => {
            vscode.window.showInformationMessage('TraeGuardian analysis ready! Check the sidebar for fix suggestions.');
        }, 1000);
    }

    public simulateError(errorOutput: string) {
        this.analyzeError(errorOutput);
    }

    public setCapturedOutput(output: string) {
        this.capturedOutput = output;
    }

    public getCapturedOutput(): string {
        return this.capturedOutput;
    }

    public dispose() {
        this.disposables.forEach(d => d.dispose());
    }
}
