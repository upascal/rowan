import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkStringify from 'remark-stringify';
import { Project, Column, Card, Subtask, ProjectData, Group } from '../types'; // Added Group
import { generateId } from '../utils/idGenerator'; // Corrected import


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
    let currentGroup: Group | null = null; // Added currentGroup
    
    // Process the AST nodes
    for (const node of ast.children as any[]) {
      try {
        // Handle headings (columns and groups)
        if (node.type === 'heading' && 'depth' in node) {
          const title = getTextFromNode(node);
          const level = node.depth;
          
          if (level === 1) { // Level 1 heading is a Column
            console.log('Processing Column:', title); // Debug log
            currentColumn = {
              id: 0, // Will be assigned by database
              projectId: 0, // Will be assigned by database
              title,
              position: projectData.columns.length,
              level,
              createdAt: now,
              updatedAt: now,
              groups: [], // Initialize groups
              cards: []   // Initialize direct cards
            };
            projectData.columns.push(currentColumn);
            currentGroup = null; // Reset group when a new column starts
          } else if (level === 2 && currentColumn) { // Level 2 heading is a Group (if inside a column)
            console.log('Processing Group:', title, 'in Column:', currentColumn.title); // Debug log
            currentGroup = {
              id: 0, // Will be assigned by database
              columnId: 0, // Will be assigned by database (linked via column)
              title,
              position: currentColumn.groups.length,
              createdAt: now,
              updatedAt: now,
              cards: []
            };
            currentColumn.groups.push(currentGroup);
          } else {
            console.warn(`Ignoring heading "${title}" at level ${level}. Only level 1 (Column) and level 2 (Group) are supported.`);
          }
        }
        // Handle lists (cards and subtasks)
        else if (node.type === 'list' && currentColumn) { // Ensure we are within a column context
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
              // Remove ID extraction from text, always generate a new ID
              const taskId = generateId(); // Use the imported generateId function
              const taskText = text.slice(text.indexOf(']') + 1).trim(); // Get text after '[ ]' or '[x]'
              console.log('Processing task:', taskText, 'completed:', completed); // Debug log (Removed ID log)
              
              const card: Card = {
                id: 0, // Placeholder ID, will be assigned by DB
                columnId: 0, // Will be assigned by database (linked via column/group)
                groupId: currentGroup ? 0 : undefined, // Will be assigned by database if group exists
                text: taskText,
                completed,
                // Position will be set based on whether it's in a group or column
                position: currentGroup ? currentGroup.cards.length : currentColumn.cards.length,
                createdAt: now,
                updatedAt: now,
                subtasks: []
              };
              
              // Process subtasks if any (Subtask logic remains the same)
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
              
              // Add card to the current group or directly to the column
              if (currentGroup) {
                currentGroup.cards.push(card);
                console.log(`Added card "${card.text}" to Group "${currentGroup.title}"`);
              } else {
                currentColumn.cards.push(card);
                 console.log(`Added card "${card.text}" directly to Column "${currentColumn.title}"`);
              }
              
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
  
  // Add columns, groups, and cards back to the AST
  for (const column of projectData.columns) {
    // Add column heading (Level 1)
    ast.children.push({
      type: 'heading',
      depth: 1, // Force columns to be level 1
      children: [{ type: 'text', value: column.title }],
    });
    
    // Add cards directly under the column (if any)
    if (column.cards && column.cards.length > 0) {
      ast.children.push({
        type: 'list',
        ordered: false,
        spread: false,
        children: column.cards.map(cardToListItem),
      });
    }
    
    // Add groups and their cards (if any)
    if (column.groups && column.groups.length > 0) {
      for (const group of column.groups) {
        // Add group heading (Level 2)
        ast.children.push({
          type: 'heading',
          depth: 2, // Force groups to be level 2
          children: [{ type: 'text', value: group.title }],
        });
        
        // Add cards within the group (if any)
        if (group.cards && group.cards.length > 0) {
          ast.children.push({
            type: 'list',
            ordered: false,
            spread: false,
            children: group.cards.map(cardToListItem),
          });
        }
      }
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
            // Removed the {id} part from the output text
            value: `[${card.completed ? 'x' : ' '}] ${card.text.trim()}`, 
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
                 // Removed the {id} part from the output text for subtasks too (though they didn't have it before)
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
