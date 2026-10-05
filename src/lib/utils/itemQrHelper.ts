export class ItemQrHelper {
  static readonly prefixItem = 'GIBOOK:ITEM:';
  static readonly prefixCode = 'GIBOOK:CODE:';

  static generateCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const now = Date.now() * 1000;
    let seed = Math.floor(now);
    let codeStr = 'ITM-';
    for (let i = 0; i < 8; i++) {
      seed = Math.imul(1664525, seed) + 1013904223;
      const idx = Math.abs(seed) % chars.length;
      codeStr += chars[idx];
    }
    return codeStr;
  }

  static encode({ itemId, qrCode }: { itemId?: string | number; qrCode?: string } = {}): string {
    if (itemId !== undefined && itemId !== null && String(itemId).trim().length > 0) {
      return `${ItemQrHelper.prefixItem}${String(itemId).trim()}`;
    }
    const code = (qrCode || '').trim();
    if (!code) {
      return '';
    }
    if (code.startsWith(ItemQrHelper.prefixItem) || code.startsWith(ItemQrHelper.prefixCode)) {
      return code;
    }
    return `${ItemQrHelper.prefixCode}${code}`;
  }

  static lookupValue(raw: string): string {
    return (raw || '').trim();
  }

  static decode(encoded: string): { type: 'item' | 'code' | 'raw'; value: string } {
    const str = ItemQrHelper.lookupValue(encoded);
    if (str.startsWith(ItemQrHelper.prefixItem)) {
      return { type: 'item', value: str.substring(ItemQrHelper.prefixItem.length) };
    }
    if (str.startsWith(ItemQrHelper.prefixCode)) {
      return { type: 'code', value: str.substring(ItemQrHelper.prefixCode.length) };
    }
    return { type: 'raw', value: str };
  }
}
