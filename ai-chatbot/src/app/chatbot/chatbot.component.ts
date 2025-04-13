import { Component, Injectable } from '@angular/core';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import {  NgModule,PipeTransform  } from '@angular/core';
import { FormsModule } from '@angular/forms'; // Import FormsModule
import { Observable } from 'rxjs';
import { CommonModule } from '@angular/common';
import { OnInit, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { DomSanitizer,SafeHtml  } from '@angular/platform-browser';
import { HeaderComponent } from "../header/header.component";
import { MatSnackBar } from '@angular/material/snack-bar';
import { UserserviceService } from '../userservice.service';
import { SelectionService } from '../selection.service';
@Component({
  selector: 'app-chatbot',
  imports: [FormsModule, CommonModule, HeaderComponent],
  templateUrl: './chatbot.component.html',
  styleUrl: './chatbot.component.css'
})
@Injectable({
  providedIn: 'root',
})
export class ChatbotComponent implements OnInit{
  value: any;
  grade = '';
  private baseUrl = 'http://localhost:8000';
  subject = '';
  language = '';
  chapterSelection: any;
showFullExplanation: any;
  constructor(private sanitizer: DomSanitizer,private selectionService: SelectionService,private http: HttpClient){}
  questions: string[] = [];
  notStart:boolean=true
  startQuestion:any

toggleFullExplanation(){
    console.log(this.showFullExplanation)
    this.showFullExplanation = !this.showFullExplanation;
  }
  @ViewChild('video', { static: false }) videoRef!: ElementRef<HTMLVideoElement>;
  private videoElement!: HTMLVideoElement;
  private emotionDetectionInterval: any;

  ngOnInit(): void {
    this.selectionService.selectedGrade$.subscribe(g => this.grade = g);
    this.selectionService.selectedSubject$.subscribe(s => this.subject = s);
    this.selectionService.selectedLanguage$.subscribe(l => this.language = l);
    this.selectionService.selectedChapterSelection$.subscribe(c => this.chapterSelection = c);

  }
  askTutor(question: string, grade: string, subject: string, language: string, userId: number) {
    const formData = new FormData();
    formData.append('user_id', userId.toString());
    formData.append('grade', grade);
    formData.append('subject', subject);
    formData.append('topic', question); // optional if not used
    formData.append('chapter_explain',this.showFullExplanation.toString() );
    formData.append('language', language);
  
    return this.http.post<any>('http://localhost:8000/tutor', formData);
  }
  ngAfterViewInit(): void {
    this.videoElement = this.videoRef.nativeElement;
  }

  startCamera(): void {
    if (!this.videoElement) {
      console.error('Video element not yet initialized.');
      return;
    }

    navigator.mediaDevices.getUserMedia({ video: true })
      .then(stream => {
        this.videoElement.srcObject = stream;
        // No need to display the video
      })
      .catch(error => {
        console.error('Error accessing camera: ', error);
      });
  }

  sendPhotoMessage(): void {
    this.startCamera();

    // Delay starting emotion detection to ensure camera has warmed up
    setTimeout(() => {
      this.emotionDetectionInterval = setInterval(() => {
        this.detectEmotion();
      }, 3000);
    }, 1000);
  }

  detectEmotion(): void {
    if (!this.videoElement || !this.videoElement.videoWidth) {
      console.error('Video element is not initialized or not ready.');
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = this.videoElement.videoWidth;
    canvas.height = this.videoElement.videoHeight;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      ctx.drawImage(this.videoElement, 0, 0, canvas.width, canvas.height);
      const base64Image = canvas.toDataURL('image/jpeg');

      const payload = {
        image: base64Image,
        user_id: '1',
        grade: this.grade,
        subject: this.subject,
        topic: 'Explain it in a better way',
        language: this.language
      };

      this.http.post(this.apiUrl + '/detect-emotion', payload).subscribe({
        next: (response:any) => {
          this.displayFormattedConceptualExplanation(response.answer);
        },
        error: (err) => {
          console.error('Error detecting emotion:', err);
        }
      });
    }
  }

  stopEmotionDetection(): void {
    if (this.emotionDetectionInterval) {
      clearInterval(this.emotionDetectionInterval);
    }
  }    

  messages: { content: SafeHtml, type: string, imageUrl?: string }[] = [];  
  mapVisible = false; 
  load: boolean = false; // Use 'boolean' (lowercase)
  fileInputValue: File | null = null; 
  recentChats: string[] = [];  // Array to hold recent chat titles
  userInput: string = ''; // For user input
  imagePreviewUrl: string | ArrayBuffer | null = null; // For image preview
  sidebarOpen: boolean = true; // Sidebar toggle state
  isMic:boolean=false
  sendMessage() {
    // if (this.load) return; // Prevent multiple requests
  
    const input = this.userInput.trim();
  
    // Return if no message and no image
    if (!input && !this.fileInputValue) return;
  
    // Push user message
    if (input) {
      this.messages.push({ content: input, type: 'user' });
    }
  
    // Reset UI immediately
    this.userInput = '';
    this.imagePreviewUrl = null;
    // this.load = true;
    this.autoResizeAfterSend();
  
    // If image exists, handle it separately
    if (this.fileInputValue) {
      this.uploadImages(); // This will also set `load = false` eventually
      this.fileInputValue = null;
      return;
    }
  
    // Only text – call tutor API
    const grade = this.grade
    const subject = this.subject;
    const language =this.language;

    this.askTutor(input, grade, subject, language,1).subscribe({
      next: (response: any) => {
        console.log('Tutor API Response:', response);
        this.load = false;
        let answer=response.answer
        
        if (this.showFullExplanation){
          this.displayTutorResponse(answer);
        }
        else{
          this.displayFormattedConceptualExplanation(answer);
        }

        this.sendPhotoMessage()
      },
      error: (err) => {
        console.error('Tutor API Error:', err);
        this.load = false;
        this.mockBotResponse("Sorry, something went wrong.");
      }
    });
  }
  displayFormattedConceptualExplanation(response: any) {
    let botMessage = '';
  
    // Check if JSON string is present
    if (!response || !response.exam_level_explanation) {
      botMessage = "Sorry, no detailed explanation available at the moment.";
      this.mockBotResponse(botMessage);
      return;
    }
  
    // Try parsing the JSON from the string
    let parsed;
    try {
      parsed = typeof response.exam_level_explanation === 'string'
        ? JSON.parse(response.exam_level_explanation)
        : response.exam_level_explanation;
    } catch (e) {
      botMessage = `<div><strong>📘 Conceptual Depth:</strong></div><div>${response.exam_level_explanation}</div>`;
      this.mockBotResponse(botMessage);
      return;
    }
  
    // Start formatting
    if (parsed.topic) {
      botMessage += `<div><strong>📚 Topic:</strong> ${parsed.topic}</div><br/>`;
    }
  
    if (parsed.explanation) {
      botMessage += `<div><strong>📘 Explanation:</strong></div><div>${parsed.explanation}</div><br/>`;
    }
  
    if (Array.isArray(parsed.key_concepts)) {
      botMessage += `<div><strong>🧠 Key Concepts:</strong></div>`;
      parsed.key_concepts.forEach((concept: any, index: number) => {
        botMessage += `
          <div style="margin-left: 1rem;">
            <div><strong>🔹 ${concept.concept}</strong></div>
            <div><em>Definition:</em> ${concept.definition}</div>
            <div><em>Example:</em> ${concept.example}</div>
            ${concept.formula ? `<div><em>Formula:</em> ${concept.formula}</div>` : ''}
            ${concept.conditions ? `<div><em>Conditions:</em> ${concept.conditions}</div>` : ''}
          </div><br/>
        `;
      });
    }
  
    if (parsed.fun_fact) {
      botMessage += `<div><strong>🎉 Fun Fact:</strong> ${parsed.fun_fact}</div><br/>`;
    }
  
    if (Array.isArray(parsed.real_life_applications)) {
      botMessage += `<div><strong>🌍 Real-Life Applications:</strong></div>`;
      parsed.real_life_applications.forEach((app: any) => {
        botMessage += `
          <div style="margin-left: 1rem;">
            <div><strong>✔ ${app.application}</strong></div>
            <div>${app.example}</div>
          </div><br/>
        `;
      });
    }
  
    this.mockBotResponse(botMessage);
  }
    
  displayTutorResponse(response: any) {
    let botMessage = '';
    let x=response
  
    // Display chapter name
    botMessage += `<div><strong>📚 Chapter:</strong> ${x.chapter}</div><hr />`;
  
    if (x.contents && x.explanations) {
      // Loop through contents and explanations to format them
      for (let i = 0; i < x.contents.length; i++) {
        const content = x.contents[i];
        const explanation = x.explanations[i] ? x.explanations[i].explanation : "No explanation available.";
        
        // Add topic and explanation for each content
        botMessage += `
          <div><strong>📘 Topic:</strong> ${content}</div>
          <div><strong>🧠 Explanation:</strong> ${explanation}</div>
          <hr />
        `;
      }
    } else {
      botMessage = "Sorry, I don't have enough information.";
    }
  
    this.mockBotResponse(botMessage);
  }
    

autoResize(event: Event): void {
  const textarea = event.target as HTMLTextAreaElement;
  textarea.style.height = 'auto'; // Reset the height

  // Calculate the maximum height (for 6 rows)
  const lineHeight = 24; // Adjust this value based on your CSS
  const maxRows = 6;
  const maxHeight = lineHeight * maxRows;

  // Set height to scroll height but not exceeding max height
  textarea.style.height = `${Math.min(textarea.scrollHeight, maxHeight)}px`;
}
formatResponse(answer: string): string {
  try {
    // Convert JSON-like response into actual JSON
    const jsonResponse = JSON.parse(answer);

    // Format JSON as structured HTML for display
    return `
      <div><strong>Scientific Name:</strong> ${jsonResponse["Scientific Name"]}</div>
      <div><strong>Family:</strong> ${jsonResponse["Family"]}</div>
      <div><strong>Key Characteristics:</strong> ${jsonResponse["Key Characteristics"]}</div>
      <div><strong>Habitat:</strong> ${jsonResponse["Habitat"]}</div>
      <div><strong>Ecological Roles:</strong> ${jsonResponse["Ecological Roles"]}</div>
      <div><strong>Notable Behaviors:</strong> ${jsonResponse["Notable Behaviors"]}</div>
    `;
  } catch (e) {
    console.error('Failed to parse response as JSON', e);
    return answer; // Return the raw response in case of parsing failure
  }}

autoResizeAfterSend(): void {
  const textarea = document.querySelector('textarea[name="userInput"]') as HTMLTextAreaElement;
  if (textarea) {
    textarea.style.height = 'auto'; // Reset the height

    // Calculate the maximum height (for 6 rows)
    const lineHeight = 24; // Adjust this value based on your CSS
    const maxRows = 6;
    const maxHeight = lineHeight * maxRows;

    // Set height to scroll height but not exceeding max height
    textarea.style.height = `${Math.min(textarea.scrollHeight, maxHeight)}px`;
  }
}

handleFileInput(event: Event) {
  const input = event.target as HTMLInputElement;
  if (input.files && input.files.length > 0) {
      const files = Array.from(input.files);
      files.forEach(file => {
          const reader = new FileReader();
          
          reader.onload = () => {
              this.imagePreviewUrl = reader.result as string;

              // Check if the image is already added to messages
              const isImageExist = this.messages.some(message => message.imageUrl === this.imagePreviewUrl);

              if (!isImageExist) {
                  // this.messages.push({
                  //     imageUrl: this.imagePreviewUrl,
                  //     content: '',
                  //     type: 'user'
                  // });
                  this.messages.push({
                    imageUrl: this.imagePreviewUrl,
                    content: '',
                    type: '',
                  })

              }
          };
          
          reader.readAsDataURL(file);  // Read the file as data URL
      });
  }
}
private apiUrl = 'http://localhost:8000'; // Change to HTTP for local development

// uploadImageForClassification(formData: FormData): Observable<any> {
//   console.log(formData)

//   return this.http.post<any>(`${this.apiUrl}/image`, formData);
// }
// askQuestion(data: string) {
// return this.http.post<any>(`${this.apiUrl}/ask-question/`, { user_question: data });
// }  
uploadImages() {
  const formData = new FormData();

  // Loop through all the messages to find images and text
  this.messages.forEach((message, index) => {
    if (message.content) {
      formData.append('text', this.userInput); // Attach the text content (if any)
    }

    if (message.imageUrl) {
      // Convert data URL to a file
      const imageFile = this.dataURLtoFile(message.imageUrl, `image_${index}.png`);
      formData.append('files', imageFile, imageFile.name); // Append the image file with a unique name
    }
  });

  // Send the form data to the server
  // this.uploadImageForClassification(formData).subscribe(
  //   (response: any) => {
  //     console.log('Server response:', response);

  //     // Add the server response to the messages
  //     if (response) {
  //       // this.messages.push({
  //       //   content: response.result.final_conclusion,
  //       //   type: 'bot',
  //       // });
  //       console.log('this need to be priinted ',response.final_conclusion)
  //       let j = 1;
  //       for (let i of response.individual_responses) {
  //         // Apply special styling to the "The Image X Shows" message
  //         this.mockBotResponse(`
  //           <div style="text-align: center; font-size: 24px; font-weight: bold;  padding: 20px;">
  //             **The Image ${j} Shows**
  //           </div>
  //         `);
  //         console.log(i);
  //         this.mockBotResponse(i);
  //         j++;
  //       }
        
  //       // Apply special styling to the "The Conclusion:" message
  //       this.mockBotResponse(`
  //         <div style="text-align: center; font-size: 24px; font-weight: bold;  padding: 20px;">
  //           **The Conclusion:**
  //         </div>
  //       `);
        
  //       // Regular message for the final conclusion
  //       this.mockBotResponse(response.final_conclusion);
        
  //     }
  //     this.load = false;
  //   },
  //   (error:any) => {
  //     this.load = false;
  //     console.error('Error uploading images:', error);

  //     this.messages.push({
  //       content: 'Sorry, there was an error processing your images.',
  //       type: 'bot'
  //     });
  //   }
  // );
}

capitalizeFirstLetter(string: string): string {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

dataURLtoFile(dataUrl: string, filename: string): File {
  const arr = dataUrl.split(',');

  // Use a null check for .match()
  const mimeMatch = arr[0].match(/:(.*?);/);
  if (!mimeMatch) {
      throw new Error("Invalid data URL: mime type not found");
  }
  const mime = mimeMatch[1];

  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);

  while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
  }

  return new File([u8arr], filename, { type: mime });
}


      
  
transform(value: string): string {
  if (!value) return value;

  // Replace new lines with <br> and bold markers with <strong>
  let formattedValue = value
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold text
    .replace(/\n/g, '<br>'); // New lines

  return formattedValue;
}

startSpeechRecognition() {
  this.isMic=true
  const recognition = new (window as any).webkitSpeechRecognition(); // Use webkitSpeechRecognition for Chrome
  recognition.lang = 'en-US'; // Set language
  recognition.interimResults = false; // We want only final results
  recognition.maxAlternatives = 1; // Only the best alternative

  recognition.start(); // Start the recognition

  // Handle the result event
  recognition.onresult = (event: any) => {
    const transcript = event.results[0][0].transcript; // Get the transcript
    this.userInput += transcript + ' '; // Append it to the user input
  };

  // Handle the error event
  recognition.onerror = (event: any) => {
    console.error('Speech recognition error:', event.error);
  };

  // Handle the end event
  recognition.onend = () => {
    console.log('Speech recognition service has stopped.');
  };
  this.isMic=false
}


  // Simulate a bot response
private mockBotResponse(data: string) {
    console.log('modified data', data);
    
    // Sanitize the response
    const botResponse = this.sanitizer.bypassSecurityTrustHtml(this.transform(data));
    
    this.messages.push({ content: botResponse, type: 'bot' });
  }

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
  }
  onQuestionClick(question: string): void {
    console.log('Question clicked:', question);
    this.userInput=question
  }


}
