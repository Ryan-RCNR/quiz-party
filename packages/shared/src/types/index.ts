/**
 * Quiz Party Shared Types
 */

// Question Bank Types
export interface QuestionBank {
  id: string;
  name: string;
  description: string | null;
  subject: string | null;
  grade_level: string | null;
  question_count: number;
  created_at: string;
  updated_at: string;
}

export interface QuestionItem {
  id: string;
  question_text: string;
  options: string[];
  correct_index: number;
  category: string | null;
  explanation: string | null;
  created_at: string;
}

export interface QuestionBankWithQuestions extends QuestionBank {
  questions: QuestionItem[];
}

// Session Types
export interface SessionConfig {
  id: string;
  name: string;
  preset: string;
  chaos_level: string;
  game_sequence: string[];
  team_count: number;
  session_code: string | null;
  status: string;
  player_count: number | null;
  created_at: string;
}

export interface SessionCreateResponse {
  session_code: string;
  session_id: string;
  join_url: string;
  host_url: string;
  game_sequence: string[];
  preset: string;
  chaos_level: string;
}

// Player Types
export interface PlayerInfo {
  player_id: string;
  display_name: string;
  team_id: string | null;
  score: number;
  connected: boolean;
}

export interface PlayerSession {
  playerId: string;
  playerToken: string;
  displayName: string;
  sessionCode: string;
  teamId: string | null;
  teamName: string | null;
}

export interface TeamScore {
  team_id: string;
  name: string;
  total_score: number;
  average_score: number;
  member_count: number;
  active_count: number;
  rank: number;
}

export interface LeaderboardEntry {
  rank: number;
  player_id: string;
  display_name: string;
  score: number;
}

export interface Award {
  award_key: string;
  name: string;
  emoji: string;
  description: string;
  winner_id: string;
  winner_name: string;
  stat_value: string;
}

// Game Types
export type MiniGameType =
  | 'speed_race'
  | 'sharpshooter'
  | 'high_stakes'
  | 'knockout'
  | 'team_up'
  | 'marathon'
  | 'steal';

export type SessionStatus =
  | 'lobby'
  | 'game_intro'
  | 'playing'
  | 'round_results'
  | 'intermission'
  | 'random_event'
  | 'awards'
  | 'review'
  | 'ended';

export type ChaosLevel = 'chill' | 'spicy' | 'max';
export type SessionPreset = 'quick' | 'standard' | 'extended';

export const GAME_INFO: Record<MiniGameType, { name: string; emoji: string; description: string; color: string }> = {
  speed_race: { name: 'Speed Race', emoji: '\u26A1', description: 'First correct answer wins the most points!', color: 'speed-gold' },
  sharpshooter: { name: 'Sharpshooter', emoji: '\uD83C\uDFAF', description: 'Every wrong answer costs BIG. Skip if unsure!', color: 'ice' },
  high_stakes: { name: 'High Stakes', emoji: '\uD83C\uDFB0', description: 'See the category, place your wager, then answer.', color: 'stakes-amber' },
  knockout: { name: 'Knockout', emoji: '\uD83D\uDC80', description: 'One wrong and you\'re out! Last standing wins.', color: 'knockout-crimson' },
  team_up: { name: 'Team Up', emoji: '\uD83E\uDD1D', description: 'Paired with a teammate. Both must be correct!', color: 'team-purple' },
  marathon: { name: 'Marathon', emoji: '\uD83D\uDD25', description: '60 seconds of rapid fire! Build your streak!', color: 'marathon-green' },
  steal: { name: 'Steal', emoji: '\uD83C\uDFF4\u200D\u2620\uFE0F', description: 'Wrong answers open a steal window for others!', color: 'steal-orange' },
};

// WebSocket Message Types
export interface WebSocketMessage {
  type: string;
  [key: string]: unknown;
}

// Host WebSocket Messages
export interface WSLobbyUpdate {
  type: 'lobby_update';
  status: SessionStatus;
  players: PlayerInfo[];
  teams: Record<string, string[]>;
  player_count: number;
}

export interface WSPlayerConnected {
  type: 'player_connected';
  player_id: string;
  display_name: string;
  player_count: number;
}

export interface WSPlayerDisconnected {
  type: 'player_disconnected';
  player_id: string;
  player_count: number;
}

export interface WSGameIntro {
  type: 'game_intro';
  game_type: MiniGameType;
  game_name: string;
  game_description: string;
  round_number: number;
  total_rounds: number;
  questions_per_round: number;
}

export interface WSHostQuestion {
  type: 'host_question';
  question_index: number;
  total_questions: number;
  time_limit: number;
  game_type: MiniGameType;
  answers_received: number;
  total_players: number;
}

export interface WSAnswerUpdate {
  type: 'answer_update';
  answers_received: number;
  total_players: number;
}

export interface WSRoundResults {
  type: 'round_results';
  round_number: number;
  game_type: MiniGameType;
  teams: TeamScore[];
  individual_top5: LeaderboardEntry[];
  most_missed_question_id: string | null;
}

export interface WSSessionComplete {
  type: 'session_complete';
}

export interface WSSessionEnded {
  type: 'session_ended';
}

export type HostWSMessage =
  | WSLobbyUpdate
  | WSPlayerConnected
  | WSPlayerDisconnected
  | WSGameIntro
  | WSHostQuestion
  | WSAnswerUpdate
  | WSRoundResults
  | WSSessionComplete
  | WSSessionEnded;

// Player WebSocket Messages
export interface WSPlayerQuestion {
  type: 'question';
  question_id: string;
  question_text: string;
  options: string[];
  time_limit: number;
  game_type: MiniGameType;
  round_number: number;
  question_index: number;
  total_questions: number;
}

export interface WSAnswerResult {
  type: 'answer_result';
  correct: boolean;
  correct_index: number;
  points_earned: number;
  new_total: number;
  explanation: string | null;
}

export interface WSPlayerGameIntro {
  type: 'game_intro';
  game_type: MiniGameType;
  game_name: string;
  game_description: string;
}

export interface WSPlayerRoundResults {
  type: 'round_results';
  your_score: number;
  your_rank: number;
  total_players: number;
}

export type PlayerWSMessage =
  | WSPlayerQuestion
  | WSAnswerResult
  | WSPlayerGameIntro
  | WSPlayerRoundResults
  | WSSessionEnded;

// Type Guards for WebSocket Messages
export function isHostWSMessage(msg: unknown): msg is HostWSMessage {
  if (!msg || typeof msg !== 'object') return false;
  const m = msg as Record<string, unknown>;
  const validTypes = [
    'lobby_update',
    'player_connected',
    'player_disconnected',
    'game_intro',
    'host_question',
    'answer_update',
    'round_results',
    'session_complete',
    'session_ended',
  ];
  return typeof m.type === 'string' && validTypes.includes(m.type);
}

export function isPlayerWSMessage(msg: unknown): msg is PlayerWSMessage {
  if (!msg || typeof msg !== 'object') return false;
  const m = msg as Record<string, unknown>;
  const validTypes = ['question', 'answer_result', 'game_intro', 'round_results', 'session_ended'];
  return typeof m.type === 'string' && validTypes.includes(m.type);
}

// Individual message type guards
export function isLobbyUpdate(msg: unknown): msg is WSLobbyUpdate {
  return isHostWSMessage(msg) && msg.type === 'lobby_update';
}

export function isPlayerConnected(msg: unknown): msg is WSPlayerConnected {
  return isHostWSMessage(msg) && msg.type === 'player_connected';
}

export function isPlayerDisconnected(msg: unknown): msg is WSPlayerDisconnected {
  return isHostWSMessage(msg) && msg.type === 'player_disconnected';
}

export function isGameIntro(msg: unknown): msg is WSGameIntro | WSPlayerGameIntro {
  if (!msg || typeof msg !== 'object') return false;
  const m = msg as Record<string, unknown>;
  return m.type === 'game_intro';
}

export function isHostQuestion(msg: unknown): msg is WSHostQuestion {
  return isHostWSMessage(msg) && msg.type === 'host_question';
}

export function isAnswerUpdate(msg: unknown): msg is WSAnswerUpdate {
  return isHostWSMessage(msg) && msg.type === 'answer_update';
}

export function isRoundResults(msg: unknown): msg is WSRoundResults | WSPlayerRoundResults {
  if (!msg || typeof msg !== 'object') return false;
  const m = msg as Record<string, unknown>;
  return m.type === 'round_results';
}

export function isSessionComplete(msg: unknown): msg is WSSessionComplete {
  return isHostWSMessage(msg) && msg.type === 'session_complete';
}

export function isSessionEnded(msg: unknown): msg is WSSessionEnded {
  if (!msg || typeof msg !== 'object') return false;
  const m = msg as Record<string, unknown>;
  return m.type === 'session_ended';
}

export function isPlayerQuestion(msg: unknown): msg is WSPlayerQuestion {
  return isPlayerWSMessage(msg) && msg.type === 'question';
}

export function isAnswerResult(msg: unknown): msg is WSAnswerResult {
  return isPlayerWSMessage(msg) && msg.type === 'answer_result';
}
