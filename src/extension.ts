import * as vscode from 'vscode';
import { IndiviualCommenter } from './commenter/individualCommenter';
import { Commenter, CommentPostion } from './commenter/commenter';
import { GlobalCommenter } from './commenter/globalCommenter';
import { AddIndentOfFirstLineCommenter } from './commenter/addIndentOfFirstLineCommenter';


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

function getCommenter(): Commenter {
	const configuredView = vscode.workspace.getConfiguration().get('enhancedComments.indentationMode');
	switch (configuredView) {
		case 'individul':
			return new IndiviualCommenter();
		case 'global':
			return new GlobalCommenter();
		case 'add indent of first line':
			return new AddIndentOfFirstLineCommenter();
		default:
			return new IndiviualCommenter();
	}
}

async function addComment(editor: vscode.TextEditor) {
	const origSelection = editor.selection;

	const insertedPositions = await getCommenter().addComment(
		editor,
		commentOpen,
		commentOpenReplacement,
		commentClose,
		commentCloseReplacement
	);

	editor.selection = new vscode.Selection(
		origSelection.anchor.line,
		getNewPositionForAdd(origSelection.anchor, insertedPositions),
		origSelection.active.line,
		getNewPositionForAdd(origSelection.active, insertedPositions)
	);
}

function getNewPositionForAdd(pos: vscode.Position, insertedPositions: Map<number, CommentPostion>): number {
	let commentPosition = insertedPositions.get(pos.line);
	if (commentPosition !== undefined && pos.character >= commentPosition.open.start) {
		return pos.character + commentPosition.open.width;
	}
	else {
		return pos.character;
	}
}

async function removeComment(editor: vscode.TextEditor) {
	const origSelection = editor.selection;

	const removedPositions = await getCommenter().removeComment(
		editor,
		commentOpen,
		commentOpenReplacement,
		commentClose,
		commentCloseReplacement
	);

	editor.selection = new vscode.Selection(
		origSelection.anchor.line,
		getNewPositionForRemove(origSelection.anchor, removedPositions),
		origSelection.active.line,
		getNewPositionForRemove(origSelection.active, removedPositions)
	);
}

function getNewPositionForRemove(pos: vscode.Position, removedPositions: Map<number, CommentPostion>): number {
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

function IsEveryLineAComment(editor: vscode.TextEditor): boolean {
	for (let i = editor.selection.start.line; i <= editor.selection.end.line; i++) {
		const currentLine = editor.document.lineAt(i);
		let text = currentLine.text;

		if (text.match(/\S/) === null) {
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