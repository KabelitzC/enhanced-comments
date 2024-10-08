import * as vscode from 'vscode';

const consideredLanguageIds = ['html', 'xml', 'xsl', 'markdown'];

const commentOpen = '<!--';
const commentOpenReplacement = '<!~~';
const commentClose = '-->';
const commentCloseReplacement = '~~>';

export function activate(context: vscode.ExtensionContext) {

	const addCommentDisposable = vscode.commands.registerCommand('enhancedComments.addComment', async () => {
		const editor = vscode.window.activeTextEditor;
		if (editor === undefined) {
			return;
		}
		if (!consideredLanguageIds.includes(editor.document.languageId)) {
			vscode.commands.executeCommand('editor.action.addCommentLine');
			return;
		}
		await addComment(editor);
	});
	context.subscriptions.push(addCommentDisposable);

	const removeCommentDisposable = vscode.commands.registerCommand('enhancedComments.removeComment', async () => {
		const editor = vscode.window.activeTextEditor;
		if (editor === undefined) {
			return;
		}
		if (!consideredLanguageIds.includes(editor.document.languageId)) {
			vscode.commands.executeCommand('editor.action.removeCommentLine');
			return;
		}
		await removeComment(editor);
	});
	context.subscriptions.push(removeCommentDisposable);

	const toggleCommentDisposable = vscode.commands.registerCommand('enhancedComments.toggleComment', async () => {
		const editor = vscode.window.activeTextEditor;
		if (editor === undefined) {
			return;
		}
		if (!consideredLanguageIds.includes(editor.document.languageId)) {
			vscode.commands.executeCommand('editor.action.commentLine');
			return;
		}
		await toggleComment(editor);
	});
	context.subscriptions.push(toggleCommentDisposable);
}

async function toggleComment(editor: vscode.TextEditor) {
	if (IsEveryLineAComment(editor)) {
		await removeComment(editor);
	}
	else {
		await addComment(editor);
	}
}

async function addComment(editor: vscode.TextEditor) {
	const origSelection = editor.selection;
	const insertedPositions = new Map<number, number>();

	await editor.edit(editBuilder => {
		for (let i = editor.selection.start.line; i <= editor.selection.end.line; i++) {
			const currentLine = editor.document.lineAt(i);
			const firstNonWhitespaceChar = currentLine.text.match(/[^ ]/);
			if (firstNonWhitespaceChar === null || firstNonWhitespaceChar.index === undefined) {
				continue;
			}
			insertedPositions.set(i, firstNonWhitespaceChar.index);

			const before = currentLine.text.substring(0, firstNonWhitespaceChar.index);
			const after = currentLine.text.substring(firstNonWhitespaceChar.index).replaceAll(commentOpen, commentOpenReplacement).replaceAll(commentClose, commentCloseReplacement);
			editBuilder.replace(currentLine.range, before + commentOpen + ' ' + after + ' ' + commentClose);
		}
	});

	editor.selection = new vscode.Selection(
		origSelection.anchor.line,
		getNewPositionForAdd(origSelection.anchor, insertedPositions),
		origSelection.active.line,
		getNewPositionForAdd(origSelection.active, insertedPositions)
	);
}

function getNewPositionForAdd(pos: vscode.Position, insertedPositions: Map<number, number>): number {
	let commentPosition = insertedPositions.get(pos.line);
	if (commentPosition !== undefined && pos.character >= commentPosition) {
		return pos.character + commentOpen.length + 1;
	}
	else {
		return pos.character;
	}
}

async function removeComment(editor: vscode.TextEditor) {
	const origSelection = editor.selection;
	const removedPositions = new Map<number, { open: { start: number, width: number }, close: { start: number, width: number } }>();

	await editor.edit(editBuilder => {
		for (let i = editor.selection.start.line; i <= editor.selection.end.line; i++) {
			const currentLine = editor.document.lineAt(i);
			let text = currentLine.text;

			if (text.match(/^ *$/) !== null) {
				continue;
			}

			const openStart = text.indexOf(commentOpen);
			const hasOpen = openStart >= 0;
			const closeStart = text.lastIndexOf(commentClose);
			const hasClose = closeStart >= 0;
			if (hasOpen && hasClose && openStart > closeStart) {
				continue;
			}
			const openHasWhitespace = hasOpen && text.indexOf(commentOpen + ' ') === openStart;
			const closeHasWhitespace = hasClose && text.lastIndexOf(' ' + commentClose) === closeStart - 1;

			removedPositions.set(i, {
				open: {
					start: hasOpen ? openStart : 0,
					width: hasOpen ? (commentOpen.length + (openHasWhitespace ? 1 : 0)) : 0
				},
				close: {
					start: hasClose ? closeStart - (closeHasWhitespace ? 1 : 0) : text.length,
					width: hasClose ? commentClose.length + (closeHasWhitespace ? 1 : 0) : 0
				}
			});

			if (hasOpen) {
				text = text.replace(commentOpen + (openHasWhitespace ? " " : ""), "");
				text = text.replace(commentOpenReplacement, commentOpen);
			};
			if (hasClose) {
				text = replaceLast(text, (closeHasWhitespace ? " " : "") + commentClose, "");
				text = replaceLast(text, commentCloseReplacement, commentClose);
			}

			editBuilder.replace(currentLine.range, text);
		}
	});

	editor.selection = new vscode.Selection(
		origSelection.anchor.line,
		getNewPositionForRemove(origSelection.anchor, removedPositions),
		origSelection.active.line,
		getNewPositionForRemove(origSelection.active, removedPositions)
	);
}

function getNewPositionForRemove(pos: vscode.Position, removedPositions: Map<number, { open: { start: number, width: number }, close: { start: number, width: number } }>): number {
	let commentPosition = removedPositions.get(pos.line);
	if (commentPosition !== undefined) {
		if (pos.character < commentPosition.open.start) {
			return pos.character;
		}
		if (pos.character < commentPosition.open.start + commentPosition.open.width) {
			return commentPosition.open.start;
		}
		if (pos.character < commentPosition.close.start) {
			return pos.character - commentPosition.open.width;
		}
		if (pos.character < commentPosition.close.start + commentPosition.close.width) {
			return commentPosition.close.start - commentPosition.open.width;
		}
		return pos.character - commentPosition.open.width - commentPosition.close.width;
	}
	else {
		return pos.character;
	}
}

function replaceLast(str: string, searchFor: string, replaceWith: string): string {
	const pos = str.lastIndexOf(searchFor);
	if (pos < 0) {
		return str;
	}
	const before = str.substring(0, pos);
	const after = str.substring(pos + (searchFor.length));
	return (before + replaceWith + after);
}

function IsEveryLineAComment(editor: vscode.TextEditor): boolean {
	for (let i = editor.selection.start.line; i <= editor.selection.end.line; i++) {
		const currentLine = editor.document.lineAt(i);
		let text = currentLine.text;

		if (text.match(/[^ ]/) === null) {
			continue;
		}
		const openStart = text.indexOf(commentOpen);
		if (openStart < 0) {
			return false;
		}
		const closeStart = text.lastIndexOf(commentClose);
		if (closeStart < 0) {
			return false;
		}
		if (openStart > closeStart) {
			return false;
		}
	}
	return true;
}

export function deactivate() { }