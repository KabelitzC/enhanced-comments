<h1 align="center">
  <br>
    <img src="https://github.com/KabelitzC/enhanced-comments/blob/main/images/logo.large.png?raw=true" alt="logo" width="256">
  <br>
  Enhanced Comments
  <br>
</h1>

This extension enhances the comment functionality of VS Code for HTML, XML and Markdown files. 
* Call the "Add Comment" command on multiple lines and each line will get its own block comment.
* If you add a comment to a line which already has a comment, the opening and closing block will be replaced.
* The "Toggle Comment" command checks if all selected lines are comments and then adds or removes block comments.
* For all other file types the corresponding built-in commands are invoked.

![Demo](images/demo.gif)

## Configuration

This extension overrides the default keybindings of Add, Remove and Toggle Line Comment. To change the behavior, adjust the following keybindings:

![Shortcuts](images/shortcuts.png)

## Known Issues

- Embedded CSS- and JavaScript-Code in HTML is not supported.

## Release Notes

### 1.0.0

Initial release of Enhanced Comments