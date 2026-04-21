import { Injectable } from '@angular/core';
import { TrainingEvent, TrainingDrill } from '../models/training-event-model';

@Injectable({ providedIn: 'root' })
export class TrainingService {
  private events: TrainingEvent[] = [
    {
      id: 1,
      date: new Date(2026, 3, 3),
      title: 'Shooting Focus',
      color: 'red',
      duration: 90,
      intensity: 'HIGH',
      focus: '3-point shooting and free throws',
      ageGroup: 'U18',
      drills: [
        { id: 1, name: 'Catch and Shoot' },
        { id: 2, name: 'Off the Dribble 3s' },
        { id: 3, name: 'Free Throw Routine' },
        { id: 4, name: 'Corner Shooting' },
      ],
    },
    {
      id: 2,
      date: new Date(2026, 3, 5),
      title: 'Defense Drills',
      color: 'red',
      duration: 75,
      intensity: 'HIGH',
      focus: 'Man-to-man defense and zone coverage',
      ageGroup: 'U18',
      drills: [
        { id: 5, name: 'Defensive Stance Slides' },
        { id: 6, name: 'Closeout Drill' },
        { id: 7, name: 'Help Defense Rotation' },
        { id: 8, name: 'Zone Press Break' },
      ],
    },
    {
      id: 3,
      date: new Date(2026, 3, 8),
      title: 'Recovery Session',
      color: 'navy',
      duration: 45,
      intensity: 'LOW',
      focus: 'Active recovery and mobility',
      ageGroup: 'Senior',
      drills: [
        { id: 9, name: 'Light Stretching' },
        { id: 10, name: 'Foam Rolling' },
        { id: 11, name: 'Slow Dribbling' },
      ],
    },
    {
      id: 4,
      date: new Date(2026, 3, 10),
      title: 'Offensive Tactics',
      color: 'red',
      duration: 80,
      intensity: 'MEDIUM',
      focus: 'Pick and roll and motion offense',
      ageGroup: 'U18',
      drills: [
        { id: 12, name: 'Pick and Roll Coverage' },
        { id: 13, name: '5-out Motion' },
        { id: 14, name: 'Drive and Kick' },
        { id: 15, name: 'Post Feeds' },
      ],
    },
    {
      id: 5,
      date: new Date(2026, 3, 12),
      title: 'Scrimmage',
      color: 'red',
      duration: 90,
      intensity: 'HIGH',
      focus: 'Full game simulation',
      ageGroup: 'U18',
      drills: [
        { id: 16, name: '5v5 Half Court' },
        { id: 17, name: '5v5 Full Court' },
        { id: 18, name: 'End Game Situations' },
      ],
    },
    {
      id: 6,
      date: new Date(2026, 3, 15),
      title: 'Conditioning',
      color: 'navy',
      duration: 60,
      intensity: 'HIGH',
      focus: 'Cardio endurance and sprint work',
      ageGroup: 'U16',
      drills: [
        { id: 19, name: 'Suicide Sprints' },
        { id: 20, name: 'Defensive Slides' },
        { id: 21, name: 'Lane Agility' },
        { id: 22, name: 'Jump Rope' },
      ],
    },
    {
      id: 7,
      date: new Date(2026, 3, 17),
      title: 'Rebounding Drills',
      color: 'red',
      duration: 70,
      intensity: 'HIGH',
      focus: 'Boxing out and positioning',
      ageGroup: 'U18',
      drills: [
        { id: 23, name: 'Boxing Out Technique' },
        { id: 24, name: 'Offensive Rebounding' },
        { id: 25, name: 'Outlet Passing' },
        { id: 26, name: 'Tip Drill' },
      ],
    },
    {
      id: 8,
      date: new Date(2026, 3, 22),
      title: 'Team Building',
      color: 'navy',
      duration: 60,
      intensity: 'LOW',
      focus: 'Chemistry and communication',
      ageGroup: 'Senior',
      drills: [
        { id: 27, name: 'Trust Exercises' },
        { id: 28, name: 'Communication Drills' },
        { id: 29, name: 'Small Sided Games' },
      ],
    },
    {
      id: 9,
      date: new Date(2026, 3, 25),
      title: 'Game Prep',
      color: 'red',
      duration: 75,
      intensity: 'MEDIUM',
      focus: 'Opponent scouting and set plays',
      ageGroup: 'U18',
      drills: [
        { id: 30, name: 'Opponent Tendencies Review' },
        { id: 31, name: 'Inbound Plays' },
        { id: 32, name: 'Last Second Shots' },
        { id: 33, name: 'Walkthrough' },
      ],
    },
  ];

  getEvents(): TrainingEvent[] {
    return this.events;
  }

  getEventByDate(date: Date): TrainingEvent | undefined {
    return this.events.find(
      (e) =>
        e.date.getFullYear() === date.getFullYear() &&
        e.date.getMonth() === date.getMonth() &&
        e.date.getDate() === date.getDate(),
    );
  }

  getEventsByDate(year: number, month: number, day: number): TrainingEvent[] {
    return this.events.filter(
      (e) =>
        e.date.getFullYear() === year && e.date.getMonth() === month && e.date.getDate() === day,
    );
  }

  searchEvents(query: string): TrainingEvent[] {
    if (!query.trim()) return this.events;
    const q = query.toLowerCase();
    return this.events.filter(
      (e) =>
        e.title.toLowerCase().includes(q) ||
        (e.focus?.toLowerCase().includes(q) ?? false) ||
        (e.drills?.some((d) => d.name.toLowerCase().includes(q)) ?? false),
    );
  }

  addEvent(event: TrainingEvent): void {
    this.events.push(event);
  }

  getNextId(): number {
    return Math.max(...this.events.map((e) => e.id)) + 1;
  }

  updateEvent(updated: TrainingEvent): void {
    const index = this.events.findIndex((e) => e.id === updated.id);
    if (index !== -1) {
      this.events[index] = updated;
    }
  }
}
