import { describe, it, expect } from 'vitest';

import { getVisibleTabTitles } from '../app/(tabs)/tab-utils';

describe('TabLayout helper getVisibleTabTitles', () => {
  it('returns correct titles for ATC (isCoord = false)', () => {
    const titles = getVisibleTabTitles(false);
    expect(titles).toEqual(['Meus Cadastros', 'Dashboards', 'Perfil']);
  });

  it('returns correct titles for COORD (isCoord = true)', () => {
    const titles = getVisibleTabTitles(true);
    expect(titles).toEqual(['Dashboard', 'Cadastros', 'Admin', 'Perfil']);
  });
});
