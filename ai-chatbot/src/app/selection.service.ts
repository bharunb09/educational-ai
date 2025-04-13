import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SelectionService {
  private gradeSource = new BehaviorSubject<string>('');
  private subjectSource = new BehaviorSubject<string>('');
  private languageSource = new BehaviorSubject<string>('');
  private ChapterSelection = new BehaviorSubject<string>('');

  selectedChapterSelection$ = this.ChapterSelection.asObservable();
  selectedGrade$ = this.gradeSource.asObservable();
  selectedSubject$ = this.subjectSource.asObservable();
  selectedLanguage$ = this.languageSource.asObservable();

  setGrade(grade: string) {
    this.gradeSource.next(grade);
  }
  setChapterSelection(ChapterSelection: any) {
    this.ChapterSelection.next(ChapterSelection);
  }
  setSubject(subject: string) {
    this.subjectSource.next(subject);
  }

  setLanguage(language: string) {
    this.languageSource.next(language);
  }
}
