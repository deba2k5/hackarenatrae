import * as vscode from 'vscode';

export class TerminalMonitor {
    private disposables: vscode.Disposable[] = [];
    private lastErrorLines: string[] = [];

    constructor() {
        this.init();
    }

    private init() {
        console.log("Terminal Monitor initialized. Listening for terminal output...");

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
    }

    private monitorTerminal(terminal: vscode.Terminal) {
        // For VS Code/Trae IDE, we can listen to terminal events
        // Note: Full terminal output capture requires proposed APIs in some versions
        // For this implementation, we'll use the terminal's exit code and name
        // and also provide a command to manually trigger analysis
        
        this.disposables.push(
            vscode.window.onDidCloseTerminal(closedTerminal => {
                if (closedTerminal.name === terminal.name) {
                    console.log(`Terminal closed: ${closedTerminal.name}`);
                    this.handleTerminalClose(closedTerminal);
                }
            })
        );

        // Also listen for text selection in terminals
        this.disposables.push(
            vscode.commands.registerTextEditorCommand('traeguardian.analyzeSelection', () => {
                const editor = vscode.window.activeTextEditor;
                if (editor) {
                    const selection = editor.selection;
                    const text = editor.document.getText(selection);
                    if (text.trim()) {
                        this.analyzeError(text);
                    }
                }
            })
        );
    }

    private handleTerminalClose(terminal: vscode.Terminal) {
        // Try to get the last output from the terminal
        // Note: This is a simplified implementation; full output would require more complex methods
        vscode.window.showInformationMessage(
            `Terminal ${terminal.name} closed. Do you want to analyze any errors?`,
            'Analyze Last Error',
            'Skip'
        ).then(selection => {
            if (selection === 'Analyze Last Error') {
                this.analyzeError("Terminal closed - please paste the error text in the TraeGuardian sidebar.");
                // Focus the sidebar
                vscode.commands.executeCommand('traeguardian.openPanel');
            }
        });
    }

    public analyzeError(errorOutput: string) {
        console.log(`Analyzing error: ${errorOutput.substring(0, 100)}...`);
        vscode.window.showWarningMessage('TraeGuardian detected a terminal error. Analyzing...');
        
        // We'll send this to the sidebar/webview via message
        // First, open the sidebar
        vscode.commands.executeCommand('traeguardian.openPanel');
        
        // TODO: Send message to webview with error
        // For now, we'll just show a message and let the user use the UI
        setTimeout(() => {
            vscode.window.showInformationMessage('TraeGuardian analysis ready! Check the sidebar for fix suggestions.');
        }, 1000);
    }

    public simulateError(errorOutput: string) {
        this.analyzeError(errorOutput);
    }

    public dispose() {
        this.disposables.forEach(d => d.dispose());
    }
}
