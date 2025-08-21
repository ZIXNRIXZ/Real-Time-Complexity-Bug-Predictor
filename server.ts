import {
    createConnection,
    TextDocuments,
    Diagnostic,
    DiagnosticSeverity,
    ProposedFeatures,
    InitializeParams,
    TextDocumentSyncKind,
    InitializeResult
} from 'vscode-languageserver/node';

import { TextDocument } from 'vscode-languageserver-textdocument';
import { analyzeDocument } from '../analyzers/analyzer';

// Create a connection for the server
const connection = createConnection(ProposedFeatures.all);

// Create a document manager
const documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);

connection.onInitialize((params: InitializeParams) => {
    const result: InitializeResult = {
        capabilities: {
            textDocumentSync: TextDocumentSyncKind.Incremental,
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
async function validateTextDocument(textDocument: TextDocument): Promise<void> {
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
        const diagnostics = await analyzeDocument(text, languageId);
        
        // Send the computed diagnostics to VS Code
        connection.sendDiagnostics({ uri: textDocument.uri, diagnostics });
    } catch (error) {
        console.error(`Error validating document: ${error}`);
    }
}

// Make the text document manager listen on the connection
documents.listen(connection);

// Listen on the connection
connection.listen();