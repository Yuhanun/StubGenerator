// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { writeFile } from 'fs';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('StubGenerator has been activated');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json

	let generateStub = vscode.commands.registerTextEditorCommand('extension.generateStubs', (textEditor: vscode.TextEditor, edit: vscode.TextEditorEdit, args: any[]) => {
		let filePath = textEditor.document.fileName.split('\\');
		let fileName = filePath[filePath.length - 1];
		let outputStr = `#include "${fileName}"\n\n`;
		let fileContent = textEditor.document.getText();
		let structOrClassPos = [fileContent.indexOf("struct"), fileContent.indexOf("class")];
		let isStruct = structOrClassPos[0] !== -1;
		let isClass = structOrClassPos[1] !== -1;
		if (!isStruct && !isClass) {
			vscode.window.showInformationMessage("Could not find struct or class keyword");
			return;
		}

		let startIndex = structOrClassPos[+ isClass] + 5; // 0 if struct, 1 if not, +5 = lenght of "class" and "struct"

		let className = "NOCLASS";
		let nameEndIndex = 0;

		for (let i = startIndex; i < fileContent.length; i++) {
			if (fileContent[i] !== ":" && fileContent[i] !== "{") {
				continue;
			}
			className = fileContent.substr(startIndex, i - startIndex).trim();
			nameEndIndex = i;
			break;
		}

		outputStr += `// Stubs for ${isStruct ? "struct": "class"}: ${className}\n\n`;

		let regex = /(.*?)\s*?([a-zA-Z_]*)\((.*)\)((\s*)->(\s*)(.*?))?;/gmi;
		let targetText = fileContent.substr(nameEndIndex);
		let result;
		while ((result = regex.exec(targetText)) !== null) {
			if (!result.length) {
				continue;
			}
			let returnType = result[1];
			let functionName = result[2];
			let argList = result[3];
			let trailingReturn = result[4] || "";
			let newFunctionStr = `${returnType} ${className}::${functionName}(${argList})${trailingReturn} {\n\t// ...\n}`.trim() + `\n\n`;
			outputStr += newFunctionStr;
		}

		// vscode.workspace.openTextDocument()
		let fileExtension = fileName.split(".")[1];
		let newPath = textEditor.document.fileName.replace(fileExtension, "cpp");
		writeFile(newPath, outputStr, (err: NodeJS.ErrnoException | null) => {
			if (err === null) {
				vscode.window.showInformationMessage(`Wrote stubs to file ${newPath}`);
			} else {
				vscode.window.showErrorMessage(`An error occured while writing to ${newPath}: ${String(err)}`);
			}
		});

		// x.forEach(element => {
		// 	let retType = 
		// 	outputStr += `${element.trim()}\n\n`;
		// });
		// console.log(outputStr);

		// vscode.WorkspaceEdit.createFile("MYRANDOMEFILE.CPP");
	});

	context.subscriptions.push(generateStub);
}

// this method is called when your extension is deactivated
export function deactivate() {
	console.log("StubGenerator has been de-activated");
}
