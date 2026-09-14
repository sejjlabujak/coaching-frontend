import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LayoutComponent } from '../../components/layout/layout';
import { PlayerService, BackendPlayer } from '../../services/player.service';
import { ProfileService } from '../../services/profile.service';
import { StatisticsImportService } from '../../services/statistics-import.service';

type Row = Record<string, string>;
type Field = keyof typeof ALIASES;
const ALIASES = {
  playerName: ['playername', 'player', 'name'], jerseyNumber: ['jerseynumber', 'jersey', 'number'], minutesPlayed: ['minutes', 'min'],
  points: ['points', 'pts'], reboundsTotal: ['totalrebounds', 'rebounds', 'reb', 'trb'], reboundsOffensive: ['offensiverebounds', 'oreb', 'orb'], reboundsDefensive: ['defensiverebounds', 'dreb', 'drb'], assists: ['assists', 'ast'], steals: ['steals', 'stl'], blocks: ['blocks', 'blk'], turnovers: ['turnovers', 'turnover', 'to', 'tov'], foulsPersonal: ['personalfouls', 'fouls', 'pf'],
  fieldGoalsMade: ['fieldgoalsmade', 'fgm'], fieldGoalsAttempted: ['fieldgoalsattempted', 'fga'], threePointersMade: ['threepointsmade', '3pm'], threePointersAttempted: ['threepointsattempted', '3pa'], freeThrowsMade: ['freethrowsmade', 'ftm'], freeThrowsAttempted: ['freethrowsattempted', 'fta'],
  date: ['gamedate', 'date'], homeTeam: ['hometeam', 'home'], awayTeam: ['awayteam', 'away', 'opponent'], homeScore: ['homescore', 'homepoints', 'homescorepts', 'hscore', 'hs'], awayScore: ['awayscore', 'awaypoints', 'awayscorepts', 'ascore', 'as']
};
const REQUIRED: Field[] = ['date', 'homeTeam', 'awayTeam', 'homeScore', 'awayScore', 'playerName', 'points'];
const PLAYER_STATS: Field[] = ['minutesPlayed', 'points', 'reboundsTotal', 'reboundsOffensive', 'reboundsDefensive', 'assists', 'steals', 'blocks', 'turnovers', 'foulsPersonal', 'fieldGoalsMade', 'fieldGoalsAttempted', 'threePointersMade', 'threePointersAttempted', 'freeThrowsMade', 'freeThrowsAttempted'];

@Component({ selector: 'app-statistics-import', standalone: true, imports: [CommonModule, FormsModule, LayoutComponent], templateUrl: './statistics-import.html', styleUrl: './statistics-import.css' })
export class StatisticsImportComponent {
  private readonly playersApi = inject(PlayerService); private readonly profileApi = inject(ProfileService); private readonly importer = inject(StatisticsImportService); private readonly router = inject(Router);
  screen = signal<'upload' | 'review' | 'success'>('upload'); fileName = signal(''); error = signal<string | null>(null); success = signal<string | null>(null);
  rows = signal<Row[]>([]); columns = signal<string[]>([]); players = signal<BackendPlayer[]>([]); teamName = signal(''); advanced = signal(false); importing = signal(false);
  mapping: Record<string, string> = {}; selectedPlayers: Record<number, number | null> = {};
  readonly playerStatsFields = PLAYER_STATS;
  gameOverrides: Partial<Record<'homeScore' | 'awayScore', string>> = {};
  constructor() { this.playersApi.getPlayers().subscribe(p => this.players.set(p)); this.profileApi.getProfile().subscribe(p => this.teamName.set(p.teamName ?? '')); }
  onFile(event: Event) { const file = (event.target as HTMLInputElement).files?.[0]; if (file) this.read(file); }
  onDrop(event: DragEvent) { event.preventDefault(); const file = event.dataTransfer?.files[0]; if (file) this.read(file); }
  downloadTemplate() { const csv = 'game_date,home_team,away_team,home_score,away_score,player_name,jersey_number,minutes,points,field_goals_made,field_goals_attempted,three_points_made,three_points_attempted,free_throws_made,free_throws_attempted,offensive_rebounds,defensive_rebounds,total_rebounds,assists,steals,blocks,turnovers,personal_fouls\n2026-08-08,My Team,Opponent,72,68,Jane Doe,4,32:15,18,7,16,2,5,4,5,4,7,11,6,2,1,3,2'; const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' })); const link = document.createElement('a'); link.href = url; link.download = 'basketball-statistics-template.csv'; link.click(); URL.revokeObjectURL(url); }
  private read(file: File) { this.error.set(null); if (!file.name.toLowerCase().endsWith('.csv') && file.type !== 'text/csv') { this.error.set('Choose a CSV file.'); return; } if (file.size > 5_000_000) { this.error.set('The CSV must be smaller than 5 MB.'); return; } const reader = new FileReader(); reader.onload = () => { try { const matrix = this.parseCsv(String(reader.result)); if (matrix.length < 2) throw new Error('The CSV needs a header row and at least one data row.'); const headers = matrix[0].map(h => h.trim()); if (headers.some(h => !h)) throw new Error('Each CSV column needs a name.'); this.rows.set(matrix.slice(1).filter(r => r.some(v => v.trim())).map(r => Object.fromEntries(headers.map((h, i) => [h, r[i] ?? ''])))); this.columns.set(headers); this.fileName.set(`${file.name} (${Math.ceil(file.size / 1024)} KB)`); this.mapColumns(headers); this.matchPlayers(); this.screen.set('review'); } catch (e) { this.error.set(e instanceof Error ? e.message : 'Could not read the CSV.'); } }; reader.readAsText(file); }
  private parseCsv(text: string): string[][] { const out: string[][] = []; let row: string[] = [], cell = '', quote = false; for (let i = 0; i < text.length; i++) { const c = text[i], n = text[i + 1]; if (c === '"') { if (quote && n === '"') { cell += c; i++; } else quote = !quote; } else if (c === ',' && !quote) { row.push(cell.trim()); cell = ''; } else if ((c === '\n' || c === '\r') && !quote) { if (c === '\r' && n === '\n') i++; row.push(cell.trim()); out.push(row); row = []; cell = ''; } else cell += c; } if (quote) throw new Error('Malformed CSV: a quoted value is not closed.'); if (cell || row.length) { row.push(cell.trim()); out.push(row); } return out; }
  private key(value: string) { return value.toLowerCase().replace(/[^a-z0-9]/g, ''); }
  private normalized(value: string) { return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, ''); }
  private mapColumns(headers: string[]) { (Object.keys(ALIASES) as Field[]).forEach(field => this.mapping[field] = headers.find(h => ALIASES[field].includes(this.key(h))) ?? ''); }
  private matchPlayers() { this.rows().forEach((row, index) => { const name = this.normalized(this.value(row, 'playerName')); const jersey = this.value(row, 'jerseyNumber'); const exact = this.players().find(p => this.normalized(`${p.firstName} ${p.lastName}`) === name); const jerseyMatch = jersey ? this.players().find(p => String(p.jerseyNumber ?? '') === jersey) : undefined; this.selectedPlayers[index] = exact?.playerID ?? jerseyMatch?.playerID ?? null; }); }
  value(row: Row, field: Field) { const column = this.mapping[field]; return column ? row[column]?.trim() ?? '' : ''; }
  gameValue(field: 'homeScore' | 'awayScore') { return this.value(this.rows()[0], field) || this.gameOverrides[field] || ''; }
  private validScore(field: 'homeScore' | 'awayScore') { const value = Number(this.gameValue(field)); return this.gameValue(field) !== '' && Number.isFinite(value) && value >= 0; }
  missingRequired() { return REQUIRED.filter(field => {
    if (field === 'homeScore' || field === 'awayScore') return !this.validScore(field);
    return !this.mapping[field] || !this.value(this.rows()[0], field);
  }); }
  unresolvedRows() { return this.rows().map((row, index) => ({ row, index })).filter(({ index }) => !this.selectedPlayers[index]); }
  hasDuplicatePlayers() { const ids = Object.values(this.selectedPlayers).filter((id): id is number => id !== null); return new Set(ids).size !== ids.length; }
  valid() { return !this.missingRequired().length && !!this.rows().length && !this.unresolvedRows().length && !this.hasDuplicatePlayers(); }
  detectedStats() { return PLAYER_STATS.filter(field => !!this.mapping[field]).length; }
  optionalMissing() { return PLAYER_STATS.filter(field => !this.mapping[field]).length; }
  openAdvanced() { this.advanced.set(!this.advanced()); }
  applyMapping() { this.matchPlayers(); this.advanced.set(false); }
  createRosterPlayer(index: number, row: Row) { const parts = this.value(row, 'playerName').trim().split(/\s+/); if (parts.length < 2) { this.error.set('Use a first and last name before creating a roster player.'); return; } const number = Number(this.value(row, 'jerseyNumber')); this.playersApi.createPlayer({ firstName: parts.shift()!, lastName: parts.join(' '), jerseyNumber: Number.isFinite(number) ? number : null }).subscribe({ next: player => { this.players.update(players => [...players, player]); this.selectedPlayers[index] = player.playerID; }, error: e => this.error.set(e.error?.error ?? 'Could not create the roster player.') }); }
  import() { if (!this.valid()) { this.error.set('Fix the unresolved items before importing.'); return; } const numeric = (row: Row, key: Field) => { const raw = this.value(row, key); return raw === '' ? null : Number(raw); }; const first = this.rows()[0]; const playerStats = this.rows().map((row, index) => ({ playerId: this.selectedPlayers[index], playerName: this.value(row, 'playerName'), jerseyNumber: this.value(row, 'jerseyNumber') || null, minutesPlayed: this.value(row, 'minutesPlayed') || null, ...Object.fromEntries(PLAYER_STATS.filter(k => k !== 'minutesPlayed').map(k => [k, numeric(row, k)])) })); const sum = (key: Field) => playerStats.reduce((total, stat) => total + (stat[key as keyof typeof stat] as number ?? 0), 0); const payload = { game: { date: this.value(first, 'date'), homeTeam: this.value(first, 'homeTeam') || this.teamName(), awayTeam: this.value(first, 'awayTeam'), homeScore: Number(this.gameValue('homeScore')), awayScore: Number(this.gameValue('awayScore')) }, teamStats: { points: sum('points'), reboundsTotal: sum('reboundsTotal'), reboundsOffensive: sum('reboundsOffensive'), reboundsDefensive: sum('reboundsDefensive'), assists: sum('assists'), turnovers: sum('turnovers'), steals: sum('steals'), blocks: sum('blocks'), foulsPersonal: sum('foulsPersonal'), fieldGoalsMade: sum('fieldGoalsMade'), fieldGoalsAttempted: sum('fieldGoalsAttempted'), threePointersMade: sum('threePointersMade'), threePointersAttempted: sum('threePointersAttempted'), freeThrowsMade: sum('freeThrowsMade'), freeThrowsAttempted: sum('freeThrowsAttempted') }, playerStats }; this.error.set(null); this.importing.set(true); this.importer.importCsv(payload).subscribe({ next: result => { this.success.set(`${result.playersImported} players and ${this.detectedStats()} statistic fields imported.`); this.screen.set('success'); this.importing.set(false); }, error: e => { this.error.set(e.error?.error ?? 'Import failed. Please review the data.'); this.importing.set(false); } }); }
  dashboard() { this.router.navigate(['/dashboard']); }
}
