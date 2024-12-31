import * as vscode from 'vscode';
import { Commenter, CommentPostion, replaceLast } from './commenter';

export class IndiviualCommenter implements Commenter {

    async addComment(
        editor: vscode.TextEditor,
        commentOpen: string,
        commentOpenReplacement: string,
        commentClose: string,
        commentCloseReplacement: string
    ): Promise<Map<number, CommentPostion>> {
        const insertedPositions = new Map<number, CommentPostion>();

        await editor.edit(editBuilder => {
            for (let i = editor.selection.start.line; i <= editor.selection.end.line; i++) {
                const currentLine = editor.document.lineAt(i);
                const firstNonWhitespaceChar = currentLine.text.match(/\S/);
                if (firstNonWhitespaceChar === null || firstNonWhitespaceChar.index === undefined) {
                    continue;
                }

                const before = currentLine.text.substring(0, firstNonWhitespaceChar.index);
                const after = currentLine.text.substring(firstNonWhitespaceChar.index).replaceAll(commentOpen, commentOpenReplacement).replaceAll(commentClose, commentCloseReplacement);
                editBuilder.replace(currentLine.range, before + commentOpen + ' ' + after + ' ' + commentClose);
                insertedPositions.set(i, {
                    open: {
                        start: firstNonWhitespaceChar.index,
                        width: (commentOpen + ' ').length
                    },
                    close: {
                        start: (before + commentOpen + ' ' + after).length,
                        width: (' ' + commentClose).length
                    }
                });
            }
        });

        return insertedPositions;
    }

    async removeComment(
        editor: vscode.TextEditor,
        commentOpen: string,
        commentOpenReplacement: string,
        commentClose: string,
        commentCloseReplacement: string
    ): Promise<Map<number, CommentPostion>> {
        const removedPositions = new Map<number, CommentPostion>();

        await editor.edit(editBuilder => {
            for (let i = editor.selection.start.line; i <= editor.selection.end.line; i++) {
                const currentLine = editor.document.lineAt(i);
                let text = currentLine.text;

                if (text.match(/\S/) === null) {
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


                if (hasOpen) {
                    text = text.replace(commentOpen + (openHasWhitespace ? " " : ""), "");
                    text = text.replace(commentOpenReplacement, commentOpen);
                };
                if (hasClose) {
                    text = replaceLast(text, (closeHasWhitespace ? " " : "") + commentClose, "");
                    text = replaceLast(text, commentCloseReplacement, commentClose);
                }

                editBuilder.replace(currentLine.range, text);

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
            }
        });

        return removedPositions;
    }
}