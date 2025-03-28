import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkStringify from 'remark-stringify';
import { Project, Column, Card, Subtask, ProjectData } from '../types';
import { generateUniqueId, validateAndSanitizeId } from '../utils/idGenerator';


/**
 * Parses a Markdown string into a KanbanBoard object
 * @param markdown The Markdown string to parse
 * @param filePath The path to the Markdown file
 * @returns A KanbanBoard object
 */
export const parseMarkdownToProjectData = async (
  markdown: string,
  projectName: string
): Promise<ProjectData> => {
  try {
    // Parse the Markdown into an AST
    const processor = unified().use(remarkParse);
    const ast = processor.parse(markdown);
    
    // Initialize project data
    const now = new Date().toISOString();
    const project: Project = {
      id: 0, // Will be assigned by database
      name: projectName,
      createdAt: now,
      updatedAt: now
    };

    const projectData: ProjectData = {
      project,
      columns: []
    };
    
    let currentColumn: Column | null = null;
    let currentCard: Card | null = null;
    
    // Process the AST nodes
    for (const node of ast.children as any[]) {
      try {
        // Handle headings (columns)
        if (node.type === 'heading' && 'depth' in node) {
          const title = getTextFromNode(node);
          console.log('Processing column:', title); // Debug log
          
          const level = node.depth;
          
          currentColumn = {
            id: 0, // Will be assigned by database
            projectId: 0, // Will be assigned by database
            title,
            position: projectData.columns.length,
            level, // Add the level property
            createdAt: now,
            updatedAt: now,
            cards: []
          };
          
          projectData.columns.push(currentColumn);
          currentCard = null;
        }
        // Handle lists (cards and subtasks)
        else if (node.type === 'list' && currentColumn) {
          for (const item of (node as any).children) {
            if (item.type !== 'listItem') continue;
            
            // Check if this is a task by looking for a checkbox
            const paragraph = (item as any).children?.find((child: any) => child.type === 'paragraph');
            if (!paragraph) {
              console.log('Skipping item: no paragraph found'); // Debug log
              continue;
            }
            
            const firstChild = paragraph.children[0];
            if (!firstChild || firstChild.type !== 'text') {
              console.log('Skipping item: invalid first child'); // Debug log
              continue;
            }
            
            const text = firstChild.value;
            const isTask = text.startsWith('[ ]') || text.startsWith('[x]');
            
            if (isTask) {
              const completed = text.startsWith('[x]');
              // Extract task ID and text using format: [ ] {id} Task text
              // Improved ID extraction with better validation
              const taskMatch = text.slice(4).trim().match(/^{([a-zA-Z0-9_-]+)}\s*(.*)/);
              const extractedId = taskMatch?.[1];
              const taskId = extractedId ? validateAndSanitizeId(extractedId) : generateUniqueId();
              const taskText = taskMatch?.[2] || text.slice(4).trim();
              console.log('Processing task:', taskText, 'completed:', completed); // Debug log
              
              const card: Card = {
                id: taskId,
                columnId: 0, // Will be assigned by database
                text: taskText,
                completed,
                position: currentColumn.cards.length,
                groupName: currentColumn.title,
                createdAt: now,
                updatedAt: now,
                subtasks: []
              };
              
              // Process subtasks if any
              const sublist = (item as any).children?.find((child: any) => child.type === 'list');
              if (sublist) {
                for (const subitem of sublist.children) {
                  if (subitem.type !== 'listItem') continue;
                  
                  const subParagraph = subitem.children.find((child: any) => child.type === 'paragraph');
                  if (!subParagraph) continue;
                  
                  const subFirstChild = subParagraph.children[0];
                  if (!subFirstChild || subFirstChild.type !== 'text') continue;
                  
                  const subText = subFirstChild.value;
                  const isSubtask = subText.startsWith('[ ]') || subText.startsWith('[x]');
                  
                  if (isSubtask) {
                    const subCompleted = subText.startsWith('[x]');
                    const subtaskText = subText.slice(4).trim();
                    console.log('Processing subtask:', subtaskText, 'completed:', subCompleted); // Debug log
                    
                    card.subtasks.push({
                      id: 0, // Will be assigned by database
                      cardId: 0, // Will be assigned by database
                      text: subtaskText,
                      completed: subCompleted,
                      position: card.subtasks.length,
                      createdAt: now,
                      updatedAt: now
                    });
                  }
                }
              }
              
              currentColumn.cards.push(card);
            } else {
              console.log('Skipping non-task item:', text); // Debug log
            }
          }
        }
      } catch (nodeError) {
        console.error('Error processing node:', nodeError);
        console.error('Node type:', node.type);
        console.error('Node content:', JSON.stringify(node, null, 2));
      }
    }
    
    console.log('Parsed project data:', JSON.stringify(projectData, null, 2)); // Debug log
    return projectData;
  } catch (error) {
    console.error('Error parsing markdown:', error);
    console.error('Markdown content:', markdown);
    throw new Error(`Failed to parse markdown: ${error}`);
  }
};

/**
 * Extracts text content from a heading node
 * @param node The heading node
 * @returns The text content
 */
const getTextFromNode = (node: any): string => {
  if (!node.children) return '';
  
  return node.children
    .filter((child: any) => child.type === 'text')
    .map((child: any) => child.value)
    .join('');
};

/**
 * Extracts text content from a list item node
 * @param node The list item node
 * @returns The text content
 */
const getTextFromListItem = (node: any): string => {
  if (!node.children) return '';
  
  // Find the paragraph node
  const paragraph = node.children.find((child: any) => child.type === 'paragraph');
  if (!paragraph) return '';
  
  return paragraph.children
    .filter((child: any) => child.type === 'text')
    .map((child: any) => child.value)
    .join('');
};

/**
 * Converts a KanbanBoard object back to a Markdown string
 * @param board The KanbanBoard object to convert
 * @returns A Markdown string
 */
export const projectDataToMarkdown = (projectData: ProjectData): string => {
  // Create a new AST
  const ast: any = {
    type: 'root',
    children: [],
  };
  
  // Add columns (headings) and cards (list items)
  for (const column of projectData.columns) {
    // Add heading
    ast.children.push({
      type: 'heading',
      depth: column.level,
      children: [
        {
          type: 'text',
          value: column.title,
        },
      ],
    });
    
    // Add list if there are cards
    if (column.cards.length > 0) {
      const listNode = {
        type: 'list',
        ordered: false,
        spread: false,
        children: column.cards.map(cardToListItem),
      };
      
      ast.children.push(listNode);
    }
  }
  
  // Convert AST back to Markdown
  const file = unified()
    .use(remarkParse)
    .use(remarkStringify, {
      bullet: '-',
      listItemIndent: 'one',
      strong: '*',
      emphasis: '_',
      setext: false // Force ATX-style headings
    })
    .data('settings', {})
    .processSync({
      type: 'root',
      children: ast.children
    });
  
  return String(file);
};

/**
 * Converts a KanbanCard to a list item node
 * @param card The KanbanCard to convert
 * @returns A list item node
 */
const cardToListItem = (card: Card): any => {
  const listItem: any = {
    type: 'listItem',
    checked: card.completed,
    spread: false,
    children: [
      {
        type: 'paragraph',
        children: [
          {
            type: 'text',
            value: `[${card.completed ? 'x' : ' '}] {${card.id}} ${card.text.trim()}`,
          },
        ],
      },
    ],
  };
  
  // Add subtasks if any
  if (card.subtasks.length > 0) {
    const subtaskList = {
      type: 'list',
      ordered: false,
      spread: false,
      children: card.subtasks.map((subtask) => ({
        type: 'listItem',
        checked: subtask.completed,
        spread: false,
        children: [
          {
            type: 'paragraph',
            children: [
              {
                type: 'text',
                value: `[${subtask.completed ? 'x' : ' '}] ${subtask.text.trim()}`,
              },
            ],
          },
        ],
      })),
    };
    
    listItem.children.push(subtaskList);
  }
  
  return listItem;
};
