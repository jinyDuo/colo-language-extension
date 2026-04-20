import * as vscode from 'vscode';

export const SHEET_LANGUAGE_HELPER_OUTPUT_CHANNEL_NAME = 'Sheet Language Global Helper';

export const createSheetLanguageHelperOutputChannel = (): vscode.OutputChannel => {
	return vscode.window.createOutputChannel(SHEET_LANGUAGE_HELPER_OUTPUT_CHANNEL_NAME);
};

export const appendSheetLanguageHelperLineWithConsoleMirror = (
	outputChannel: vscode.OutputChannel,
	line: string
): void => {
	outputChannel.appendLine(line);
	console.log(line);
};
