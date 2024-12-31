<h1 align="center">
  <br>
    <img src="https://github.com/KabelitzC/enhanced-comments/blob/main/images/logo.large.png?raw=true" alt="logo" width="256">
  <br>
  Enhanced Comments
  <br>
</h1>

<p align="center">
  <a href="https://marketplace.visualstudio.com/items?itemName=KabelitzC.enhanced-comments">
    <img alt="VS Code Marketplace Installs" src="https://img.shields.io/visual-studio-marketplace/v/KabelitzC.enhanced-comments"></a>
  <a href="https://marketplace.visualstudio.com/items?itemName=KabelitzC.enhanced-comments">
    <img alt="VS Code Marketplace Downloads" src="https://img.shields.io/visual-studio-marketplace/d/KabelitzC.enhanced-comments"></a>
  <a href="https://marketplace.visualstudio.com/items?itemName=KabelitzC.enhanced-comments">
    <img alt="VS Code Marketplace Installs" src="https://img.shields.io/visual-studio-marketplace/i/KabelitzC.enhanced-comments"></a>
  <a href="https://github.com/KabelitzC/enhanced-comments/blob/main/LICENSE">
    <img alt="VS Code Marketplace Installs" src="https://img.shields.io/badge/license-MIT-blue.svg"></a>
</p>

This extension enhances the comment functionality of VS Code for HTML, XML and Markdown files.

- Call the "Add Comment" command on multiple lines and each line will get its own block comment.
- If you add a comment to a line which already has a comment, the opening and closing block will be replaced.
- The "Toggle Comment" command checks if all selected lines are comments and then adds or removes block comments.
- For all other file types the corresponding built-in commands are invoked.

![Demo](images/demo.gif)

## Configuration

### Keybindings
This extension overrides the default keybindings of Add, Remove and Toggle Line Comment. To change the behavior, adjust the following keybindings:

![Shortcuts](images/shortcuts.png)


### Indentation Mode

There are three different indentation modes:

1. individual: The comment starts at the position where the first non-whitespace charakter is. This is computed for each line individually.  
![Example: individual](images/individual.png)
2. global: The comment starts for each line at the position where the first non-whitespace charakter of the first marked line is.  
![Example: global](images/global.png)
3. add indent of first line: The comment starts for each line at the position where the first non-whitespace charakter of the first marked line is. Additionally the indent of the first line is added to every line.  
![Example: add indent of first line](images/add-indent-of-first-line.png)

 You can specifiy it in the settings:  
![Settings](images/settings.png)


## Known Issues

- Embedded CSS- and JavaScript-Code in HTML is not supported.
- The global indentation mode does not work properly, if you use whitespaces and tabs for indentation at the same time.

## Release Notes


### 1.1.0

- Added different indentation modes
- Improved blank line detection

### 1.0.0

Initial release of Enhanced Comments
