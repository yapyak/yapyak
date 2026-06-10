import type {
  DateNode,
  NumberNode,
  PluralNode,
  SelectNode,
  Template,
  TemplateNode,
  TimeNode,
} from './node';

export function generateTemplate(template: Template): string {
  if (template.length === 0) {
    return "''";
  }
  if (template.length === 1) {
    return generateNode(template[0] as TemplateNode);
  }
  return template.map(generateNode).join('+');
}

function generateNode(node: TemplateNode): string {
  switch (node.kind) {
    case 'literal':
      return JSON.stringify(node.value);
    case 'placeholder':
      return generatePlaceholder(node.name);
    case 'count':
      return 'formattedCount';
    case 'plural':
      return generatePlural(node);
    case 'select':
      return generateSelect(node);
    case 'number':
      return generateNumber(node);
    case 'date':
      return generateDate(node);
    case 'time':
      return generateTime(node);
  }
}

function generatePlaceholder(name: string): string {
  const key = JSON.stringify(name);
  return `(params[${key}]===undefined?'':String(params[${key}]))`;
}

function generatePlural(node: PluralNode): string {
  const key = JSON.stringify(node.name);
  const type = JSON.stringify(node.type);
  const branches = [...node.branches.entries()];
  const exact = branches.filter(([branchName]) => branchName.startsWith('='));
  const category = branches.filter(
    ([branchName]) => !branchName.startsWith('='),
  );
  const otherTemplate = node.branches.get('other') ?? [];

  let body = '((count)=>{';
  body +=
    'const formattedCount=resolveFormatter(Intl.NumberFormat,locale,{}).format(count);';
  for (const [exactName, branchTemplate] of exact) {
    const value = exactName.slice(1);
    body += `if(count===${value})return ${generateTemplate(branchTemplate)};`;
  }
  body += `const cat=resolveFormatter(Intl.PluralRules,locale,{type:${type}}).select(count);`;
  for (const [categoryName, branchTemplate] of category) {
    if (categoryName === 'other') {
      continue;
    }
    body += `if(cat===${JSON.stringify(categoryName)})return ${generateTemplate(branchTemplate)};`;
  }
  body += `return ${generateTemplate(otherTemplate)};`;
  body += `})(Number(params[${key}]))`;
  return body;
}

function generateSelect(node: SelectNode): string {
  const key = JSON.stringify(node.name);
  const otherTemplate = node.branches.get('other') ?? [];

  let body = '((value)=>{';
  for (const [branchName, branchTemplate] of node.branches) {
    if (branchName === 'other') {
      continue;
    }
    body += `if(value===${JSON.stringify(branchName)})return ${generateTemplate(branchTemplate)};`;
  }
  body += `return ${generateTemplate(otherTemplate)};`;
  body += `})(String(params[${key}]))`;
  return body;
}

function generateNumber(node: NumberNode): string {
  const key = JSON.stringify(node.name);
  const options = JSON.stringify(node.options);
  return (
    '((raw)=>{' +
    "if(raw===undefined||raw===null)return'';" +
    'const n=Number(raw);' +
    'if(Number.isNaN(n))return String(raw);' +
    `return resolveFormatter(Intl.NumberFormat,locale,${options}).format(n);` +
    `})(params[${key}])`
  );
}

function generateDate(node: DateNode): string {
  const key = JSON.stringify(node.name);
  const style = JSON.stringify(node.style);
  return (
    '((raw)=>{' +
    'const date=toDate(raw);' +
    "if(date===undefined)return'';" +
    `return resolveFormatter(Intl.DateTimeFormat,locale,{dateStyle:${style}}).format(date);` +
    `})(params[${key}])`
  );
}

function generateTime(node: TimeNode): string {
  const key = JSON.stringify(node.name);
  const style = JSON.stringify(node.style);
  return (
    '((raw)=>{' +
    'const date=toDate(raw);' +
    "if(date===undefined)return'';" +
    `return resolveFormatter(Intl.DateTimeFormat,locale,{timeStyle:${style}}).format(date);` +
    `})(params[${key}])`
  );
}
