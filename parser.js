"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllNodesByType = exports.getNodeByType = exports.parseCode = void 0;
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const web_tree_sitter_1 = __importDefault(require("web-tree-sitter"));
// Map of language IDs to their Tree-sitter grammar
const LANGUAGE_GRAMMARS = {
    'python': 'tree-sitter-python',
    'cpp': 'tree-sitter-cpp',
    'java': 'tree-sitter-java',
    'javascript': 'tree-sitter-javascript',
    'typescript': 'tree-sitter-typescript'
};
// Cache for initialized parsers
const parsers = {};
let isInitialized = false;
/**
 * Initialize Tree-sitter for a specific language
 * @param languageId The language ID
 * @returns A promise that resolves to a Parser instance
 */
async function initializeParser(languageId) {
    // Check if parser is already initialized
    if (parsers[languageId]) {
        return parsers[languageId];
    }
    try {
        // Initialize Tree-sitter if not already done
        if (!isInitialized) {
            await web_tree_sitter_1.default.init();
            isInitialized = true;
        }
        const parser = new web_tree_sitter_1.default();
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
        const lang = await web_tree_sitter_1.default.Language.load(langWasm);
        parser.setLanguage(lang);
        // Cache the parser
        parsers[languageId] = parser;
        return parser;
    }
    catch (error) {
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
async function parseCode(code, languageId) {
    try {
        const parser = await initializeParser(languageId);
        if (!parser) {
            return undefined;
        }
        // Parse the code
        const tree = parser.parse(code);
        return tree.rootNode;
    }
    catch (error) {
        console.error(`Error parsing code for ${languageId}:`, error);
        return undefined;
    }
}
exports.parseCode = parseCode;
/**
 * Get a specific node by type from the AST
 * @param root The root syntax node
 * @param type The node type to find
 * @returns The first node of the specified type or undefined
 */
function getNodeByType(root, type) {
    if (root.type === type) {
        return root;
    }
    for (let i = 0; i < root.childCount; i++) {
        const child = root.child(i);
        if (!child)
            continue;
        const result = getNodeByType(child, type);
        if (result) {
            return result;
        }
    }
    return undefined;
}
exports.getNodeByType = getNodeByType;
/**
 * Get all nodes of a specific type from the AST
 * @param root The root syntax node
 * @param type The node type to find
 * @returns An array of nodes of the specified type
 */
function getAllNodesByType(root, type) {
    const results = [];
    if (root.type === type) {
        results.push(root);
    }
    for (let i = 0; i < root.childCount; i++) {
        const child = root.child(i);
        if (!child)
            continue;
        results.push(...getAllNodesByType(child, type));
    }
    return results;
}
exports.getAllNodesByType = getAllNodesByType;
//# sourceMappingURL=parser.js.map