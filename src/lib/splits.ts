export interface InputSplit {
  userId: string;
  shareValue?: number;
  percentage?: number;
  amountOwed?: number;
}

export interface OutputSplit {
  userId: string;
  amountOwed: number;
  shareValue?: number;
  percentage?: number;
}

export function calculateSplits(
  totalAmount: number,
  splitType: string,
  splits: InputSplit[]
): OutputSplit[] {
  if (splits.length === 0) {
    throw new Error('At least one user must be included in the split');
  }

  // Ensure totalAmount is a rounded number
  const total = Math.round(totalAmount * 100) / 100;

  if (splitType === 'EQUAL') {
    const n = splits.length;
    const baseAmount = Math.floor((total / n) * 100) / 100;
    const distributed = baseAmount * n;
    let remainder = Math.round((total - distributed) * 100); // in cents

    const result: OutputSplit[] = splits.map((s) => ({
      userId: s.userId,
      amountOwed: baseAmount,
    }));

    // Distribute remainder cents one by one to users
    let idx = 0;
    while (remainder > 0) {
      result[idx].amountOwed = Math.round((result[idx].amountOwed + 0.01) * 100) / 100;
      remainder--;
      idx = (idx + 1) % n;
    }

    return result;
  }

  if (splitType === 'UNEQUAL') {
    let sum = 0;
    const result: OutputSplit[] = splits.map((s) => {
      const amt = Math.round((s.amountOwed || 0) * 100) / 100;
      sum += amt;
      return {
        userId: s.userId,
        amountOwed: amt,
      };
    });

    const diff = Math.abs(total - sum);
    if (diff > 0.01) {
      throw new Error(`The sum of split amounts (${sum.toFixed(2)}) must equal the total amount (${total.toFixed(2)})`);
    }

    // Adjust any tiny rounding difference (like 0.01)
    if (diff > 0 && diff <= 0.01) {
      if (sum < total) {
        result[0].amountOwed = Math.round((result[0].amountOwed + 0.01) * 100) / 100;
      } else {
        result[0].amountOwed = Math.round((result[0].amountOwed - 0.01) * 100) / 100;
      }
    }

    return result;
  }

  if (splitType === 'PERCENTAGE') {
    let pctSum = 0;
    splits.forEach((s) => {
      pctSum += s.percentage || 0;
    });

    if (Math.abs(pctSum - 100) > 0.01) {
      throw new Error(`The sum of percentages must be exactly 100% (currently ${pctSum}%)`);
    }

    let sum = 0;
    const result: OutputSplit[] = splits.map((s) => {
      const pct = s.percentage || 0;
      const amt = Math.round(total * (pct / 100) * 100) / 100;
      sum += amt;
      return {
        userId: s.userId,
        amountOwed: amt,
        percentage: pct,
      };
    });

    let diff = Math.round((total - sum) * 100); // difference in cents
    let idx = 0;
    while (diff !== 0) {
      const step = diff > 0 ? 0.01 : -0.01;
      result[idx].amountOwed = Math.round((result[idx].amountOwed + step) * 100) / 100;
      diff += diff > 0 ? -1 : 1;
      idx = (idx + 1) % result.length;
    }

    return result;
  }

  if (splitType === 'SHARE') {
    let totalShares = 0;
    splits.forEach((s) => {
      totalShares += s.shareValue || 0;
    });

    if (totalShares <= 0) {
      throw new Error('Total shares must be greater than 0');
    }

    let sum = 0;
    const result: OutputSplit[] = splits.map((s) => {
      const sh = s.shareValue || 0;
      const amt = Math.round(total * (sh / totalShares) * 100) / 100;
      sum += amt;
      return {
        userId: s.userId,
        amountOwed: amt,
        shareValue: sh,
      };
    });

    let diff = Math.round((total - sum) * 100); // difference in cents
    let idx = 0;
    while (diff !== 0) {
      // only adjust users who have non-zero shares
      if ((result[idx].shareValue || 0) > 0) {
        const step = diff > 0 ? 0.01 : -0.01;
        result[idx].amountOwed = Math.round((result[idx].amountOwed + step) * 100) / 100;
        diff += diff > 0 ? -1 : 1;
      }
      idx = (idx + 1) % result.length;
    }

    return result;
  }

  throw new Error(`Unknown split type: ${splitType}`);
}
