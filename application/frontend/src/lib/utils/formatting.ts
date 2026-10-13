export function formatUSD(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatPhoneNumber(phoneNumber: string): string {
  const cleaned = phoneNumber.replace(/\D/g, '');

  if (cleaned[0] === '1') {
    return cleaned.replace(/^(\+?1)(\d{3})(\d{3})(\d{4})$/, '+$1 $2 $3 $4');
  } else {
    if (cleaned[0] === '4' && cleaned[1] === '4') {
      return cleaned.replace(/^(\+?44)(\d{4})(\d{6})$/, '+$1 $2 $3');
    } else {
      return cleaned.replace(/^(\+?\d{1,4})(\d{1,4})(\d{1,4})(\d{1,4})$/, '+$1 $2 $3 $4');
    }
  }
}
