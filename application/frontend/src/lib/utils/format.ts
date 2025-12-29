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
