import * as vscode from 'vscode';

export interface CommentPostion {
    open: { start: number, width: number },
    close: { start: number, width: number }
}

export interface Commenter {
    addComment(
        editor: vscode.TextEditor,
        commentOpen: string,
        commentOpenReplacement: string,
        commentClose: string,
        commentCloseReplacement: string
    ): Promise<Map<number, CommentPostion>>;

    removeComment(
        editor: vscode.TextEditor,
        commentOpen: string,
        commentOpenReplacement: string,
        commentClose: string,
        commentCloseReplacement: string
    ): Promise<Map<number, CommentPostion>>;
}

export function replaceLast(str: string, searchFor: string, replaceWith: string): string {
    const pos = str.lastIndexOf(searchFor);
    if (pos < 0) {
        return str;
    }
    const before = str.substring(0, pos);
    const after = str.substring(pos + (searchFor.length));
    return (before + replaceWith + after);
}