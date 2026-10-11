import {test,expect} from 'vitest';
import {createGame,place} from '../src/game';
test('placement is atomic when repeated or outside the pier',()=>{const g=createGame(); expect(place(g,'bell',0,0)).toBe(true);expect(g.light).toBe(240);expect(place(g,'bell',0,0)).toBe(false);expect(place(g,'bell',-1,0)).toBe(false);expect(g.light).toBe(240);});
