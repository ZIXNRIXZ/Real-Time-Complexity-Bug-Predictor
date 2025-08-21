"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const node_1 = require("vscode-languageserver/node");
const vscode_languageserver_textdocument_1 = require("vscode-languageserver-textdocument");
const analyzer_1 = require("../analyzers/analyzer");
// Create a connection for the server
const connection = (0, node_1.createConnection)(node_1.ProposedFeatures.all);
// Create a document manager
const documents = new node_1.TextDocuments(vscode_languageserver_textdocument_1.TextDocument);
connection.onInitialize((params) => {
    const result = {
        capabilities: {
            textDocumentSync: node_1.TextDocumentSyncKind.Incremental,
            // We don't need completion, hover, etc. for this extension
        }
    };
    return result;
});
// The content of a text document has changed
documents.onDidChangeContent(change => {
    validateTextDocument(change.document);
});
// Validate the document
async function validateTextDocument(textDocument) {
    try {
        // Get the text of the document
        const text = textDocument.getText();
        // Get the language ID
        const languageId = textDocument.languageId;
        // Skip unsupported languages
        if (!['python', 'cpp', 'java', 'javascript', 'typescript'].includes(languageId)) {
            return;
        }
        // Analyze the document
        const diagnostics = await (0, analyzer_1.analyzeDocument)(text, languageId);
        // Send the computed diagnostics to VS Code
        connection.sendDiagnostics({ uri: textDocument.uri, diagnostics });
    }
    catch (error) {
        console.error(`Error validating document: ${error}`);
    }
}
// Make the text document manager listen on the connection
documents.listen(connection);
// Listen on the connection
connection.listen();
//# sourceMappingURL=server.js.map