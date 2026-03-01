export function toTitleCase(str: string): string {
  return str.replace(/\w\S*/g, (txt) => {
    return txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase();
  });
}

export function formatCasing(sentence: string): string {
  return sentence
    .split(' ')
    .map((word) => (word === 'api' ? 'API' : word ? word.charAt(0).toUpperCase() + word.slice(1) : ''))
    .join(' ');
}

export function formatUSD(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatDate(stringDate: string): string {
  const date = new Date(stringDate).toLocaleString().split(', ');
  if (date[0] !== new Date().toLocaleString().split(', ')[0]) return date[0];
  else return date[1];
}

export function formatPhoneNumber(phoneNumber: string): string {
  const cleaned = phoneNumber.replace(/\D/g, '');

  if (cleaned[0] === '1') {
    return cleaned.replace(/^(\+?1)(\d{3})(\d{3})(\d{4})$/, '+$1 $2 $3 $4'); // Canada / United States
  } else if (cleaned[0] === '4' && cleaned[1] === '4') {
    return cleaned.replace(/^(\+?44)(\d{4})(\d{6})$/, '+$1 $2 $3'); // United Kingdom
  } else {
    return cleaned.replace(/^(\+?\d{1,4})(\d{1,4})(\d{1,4})(\d{1,4})$/, '+$1 $2 $3 $4'); // Rest of the world
  }
}

export function formatToMarkdown(element: HTMLElement): string {
  let markdown = '';

  const processNode = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      markdown += node.textContent?.replace(/\s+/g, ' ') || '';
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement;
      const tag = el.tagName.toLowerCase();

      switch (tag) {
        case 'h1':
          markdown += `\n# ${el.textContent?.trim()}\n\n`;
          break;
        case 'h2':
          markdown += `\n## ${el.textContent?.trim()}\n\n`;
          break;
        case 'h3':
          markdown += `\n### ${el.textContent?.trim()}\n\n`;
          break;
        case 'h4':
          markdown += `\n#### ${el.textContent?.trim()}\n\n`;
          break;
        case 'h5':
          markdown += `\n##### ${el.textContent?.trim()}\n\n`;
          break;
        case 'p':
          Array.from(el.childNodes).forEach(processNode);
          markdown += '\n\n';
          break;
        case 'ul':
          Array.from(el.children).forEach((li) => {
            markdown += '- ';
            Array.from(li.childNodes).forEach(processNode);
            markdown += '\n';
          });
          markdown += '\n';
          break;
        case 'ol':
          Array.from(el.children).forEach((li, index) => {
            markdown += `${index + 1}. `;
            Array.from(li.childNodes).forEach(processNode);
            markdown += '\n';
          });
          markdown += '\n';
          break;
        case 'code':
          if (el.classList.contains('alt')) {
            markdown += `\n\`\`\`\n${el.textContent?.trim()}\n\`\`\`\n`;
          } else {
            markdown += `\`${el.textContent?.trim()}\``;
          }
          break;
        case 'pre':
          markdown += `\n\`\`\`json\n${el.textContent?.trim()}\n\`\`\`\n\n`;
          break;
        case 'b':
        case 'strong':
          markdown += `**${el.textContent?.trim()}**`;
          break;
        case 'i':
        case 'em':
          markdown += `*${el.textContent?.trim()}*`;
          break;
        case 'span':
          if (el.classList.contains('string') || el.classList.contains('integer') || el.classList.contains('boolean')) {
            markdown += el.textContent?.trim() || '';
          } else {
            Array.from(el.childNodes).forEach(processNode);
          }
          break;
        case 'div':
        case 'section':
          Array.from(el.childNodes).forEach(processNode);
          break;
        default:
          Array.from(el.childNodes).forEach(processNode);
      }
    }
  };

  processNode(element);
  return markdown.trim().replace(/\n{3,}/g, '\n\n');
}
