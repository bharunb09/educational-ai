import { Component } from '@angular/core';
import { language_codes } from './languages';
import { FormsModule } from '@angular/forms';
import { SelectionService } from '../selection.service';

@Component({
  selector: 'app-header',
  imports: [FormsModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent {
  grades: number[] = Array.from({ length: 12 }, (_, i) => i + 1);
  subjects: string[] = [
    'Math', 'Science', 'English', 'Social Studies', 'Computer Science', 'Biology', 'Physics', 'Chemistry'
  ];

  languageList = Object.keys(language_codes);
  showFullExplanation: boolean = false;

  selectedGrade = '';
  selectedSubject = '';
  selectedLanguage = '';
  constructor(private selectionService: SelectionService) {}
  onGradeChange(event: Event) {
    const value = (event.target as HTMLSelectElement).value;
    this.selectedGrade = value;
    this.selectionService.setGrade(value);
  }
  
  
  onSubjectChange(event: Event) {
    const value = (event.target as HTMLSelectElement).value;
    this.selectedSubject = value;
    this.selectionService.setSubject(value);
  }
  
  onLanguageChange(event: Event) {
    const value = (event.target as HTMLSelectElement).value;
    this.selectedLanguage = value;
    this.selectionService.setLanguage(value);
  }
  onChapterSelectionChange(event: Event) {
    const value = (event.target as HTMLSelectElement).value;
    this.showFullExplanation = value === 'true';
    this.selectionService.setLanguage(value);
  }
}
