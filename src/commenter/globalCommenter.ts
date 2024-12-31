import * as vscode from 'vscode';
import { Commenter, CommentPostion, replaceLast } from './commenter';

export class GlobalCommenter implements Commenter {

    async addComment(
        editor: vscode.TextEditor,
        commentOpen: string,
        commentOpenReplacement: string,
        commentClose: string,
        commentCloseReplacement: string
    ): Promise<Map<number, CommentPostion>> {
        const insertedPositions = new Map<number, CommentPostion>();

        await editor.edit(editBuilder => {
            let indentDepth: number | undefined = undefined;

            for (let i = editor.selection.start.line; i <= editor.selection.end.line; i++) {
                const currentLine = editor.document.lineAt(i);
                const firstNonWhitespaceChar = currentLine.text.match(/\S/);
                if (firstNonWhitespaceChar === null || firstNonWhitespaceChar.index === undefined) {
                    continue;
                }

                if (indentDepth === undefined) {
                    indentDepth = firstNonWhitespaceChar.index;
                }

                const currentIndentDepth = Math.min(indentDepth, firstNonWhitespaceChar.index);

                const before = currentLine.text.substring(0, currentIndentDepth);
                const after = currentLine.text.substring(currentIndentDepth).replaceAll(commentOpen, commentOpenReplacement).replaceAll(commentClose, commentCloseReplacement);
                editBuilder.replace(currentLine.range, before + commentOpen + ' ' + after + ' ' + commentClose);
                insertedPositions.set(i, {
                    open: {
                        start: currentIndentDepth,
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
        let firstLineOpenHasWhitespace: boolean | undefined = undefined;

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
                let openHasWhitespace = hasOpen && text.indexOf(commentOpen + ' ') === openStart;
                const closeHasWhitespace = hasClose && text.lastIndexOf(' ' + commentClose) === closeStart - 1;

                if (firstLineOpenHasWhitespace === undefined) {
                    firstLineOpenHasWhitespace = openHasWhitespace;
                }
                if (!firstLineOpenHasWhitespace) {
                    openHasWhitespace = false;
                }


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