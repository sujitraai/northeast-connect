import { useCallback, useState } from 'react';

const KEY = 'nec.district';

export interface ChosenDistrict {
  district: string;
  state: string;
}

function read(): ChosenDistrict | null {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? 'null');
    return v && typeof v.district === 'string' && typeof v.state === 'string' ? v : null;
  } catch {
    return null;
  }
}

/** The district picked from the list (for people who don't share location). Saved on this phone. */
export function useChosenDistrict() {
  const [chosen, setChosen] = useState<ChosenDistrict | null>(read);
  const choose = useCallback((c: ChosenDistrict) => {
    setChosen(c);
    try {
      localStorage.setItem(KEY, JSON.stringify(c));
    } catch {
      /* storage unavailable: kept for this visit only */
    }
  }, []);
  return { chosen, choose };
}
