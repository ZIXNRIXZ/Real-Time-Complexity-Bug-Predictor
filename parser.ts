import * as path from 'path';
import * as fs from 'fs';
import Parser, { SyntaxNode } from 'web-tree-sitter';

// Map of language IDs to their Tree-sitter grammar
const LANGUAGE_GRAMMARS: Record<string, string> = {
    'python': 'tree-sitter-python',
    'cpp': 'tree-sitter-cpp',
    'java': 'tree-sitter-java',
    'javascript': 'tree-sitter-javascript',
    'typescript': 'tree-sitter-typescript'
};

// Cache for initialized parsers
const parsers: Record<string, Parser> = {};
let isInitialized = false;

/**
 * Initialize Tree-sitter for a specific language
 * @param languageId The language ID
 * @returns A promise that resolves to a Parser instance
 */
async function initializeParser(languageId: string): Promise<Parser | undefined> {
    // Check if parser is already initialized
    if (parsers[languageId]) {
        return parsers[languageId];
    }
    
    try {
        // Initialize Tree-sitter if not already done
        if (!isInitialized) {
            await Parser.init();
            isInitialized = true;
        }
        
        const parser = new Parser();
        const grammarName = LANGUAGE_GRAMMARS[languageId];
        
        if (!grammarName) {
            console.error(`No grammar defined for language: ${languageId}`);
            return undefined;
        }
        
        // Try multiple possible paths for the WASM file
        const possiblePaths = [
            path.join(__dirname, '..', '..', 'node_modules', grammarName, 'tree-sitter-language.wasm'),
            path.join(__dirname, '..', '..', 'node_modules', grammarName, 'wasm', 'tree-sitter-language.wasm'),
            path.join(__dirname, '..', '..', 'node_modules', grammarName, 'tree-sitter', 'wasm', `${languageId}.wasm`),
            path.join(__dirname, '..', '..', 'node_modules', grammarName, 'dist', `${languageId}.wasm`)
        ];
        
        let langWasm = '';
        for (const possiblePath of possiblePaths) {
            if (fs.existsSync(possiblePath)) {
                langWasm = possiblePath;
                break;
            }
        }
        
        if (!langWasm) {
            console.error(`Language WASM file not found for ${languageId}. Tried paths:`, possiblePaths);
            return undefined;
        }
        
        const lang = await Parser.Language.load(langWasm);
        parser.setLanguage(lang);
        
        // Cache the parser
        parsers[languageId] = parser;
        
        return parser;
    } catch (error) {
        console.error(`Error initializing parser for ${languageId}:`, error);
        return undefined;
    }
}

/**
 * Parse code using Tree-sitter
 * @param code The code to parse
 * @param languageId The language ID
 * @returns A promise that resolves to the root syntax node
 */
export async function parseCode(code: string, languageId: string): Promise<SyntaxNode | undefined> {
    try {
        const parser = await initializeParser(languageId);
        
        if (!parser) {
            return undefined;
        }
        
        // Parse the code
        const tree = parser.parse(code);
        return tree.rootNode;
    } catch (error) {
        console.error(`Error parsing code for ${languageId}:`, error);
        return undefined;
    }
}

/**
 * Get a specific node by type from the AST
 * @param root The root syntax node
 * @param type The node type to find
 * @returns The first node of the specified type or undefined
 */
export function getNodeByType(root: SyntaxNode, type: string): SyntaxNode | undefined {
    if (root.type === type) {
        return root;
    }
    
    for (let i = 0; i < root.childCount; i++) {
        const child = root.child(i);
        if (!child) continue;
        
        const result = getNodeByType(child, type);
        if (result) {
            return result;
        }
    }
    
    return undefined;
}

/**
 * Get all nodes of a specific type from the AST
 * @param root The root syntax node
 * @param type The node type to find
 * @returns An array of nodes of the specified type
 */
export function getAllNodesByType(root: SyntaxNode, type: string): SyntaxNode[] {
    const results: SyntaxNode[] = [];
    
    if (root.type === type) {
        results.push(root);
    }
    
    for (let i = 0; i < root.childCount; i++) {
        const child = root.child(i);
        if (!child) continue;
        
        results.push(...getAllNodesByType(child, type));
    }
    
    return results;
}